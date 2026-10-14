import { db } from "@/prisma/db";
import { isAdminRole } from "@/lib/auth/roles";
import { createAuditLog } from "@/lib/audit/log";
import { AccountMutationError, toAccountDto } from "@/lib/admin/accounts";

type UpdateOwnAccountProfileInput = {
    userId: number;
    sessionTokenHash: string;
    expectedEmail: string;
    verifiedPasswordHash: string;
    nama: string;
    email: string;
    passwordHashForEmailChange: string | null;
};

export async function updateOwnAccountProfile({
    userId,
    sessionTokenHash,
    expectedEmail,
    verifiedPasswordHash,
    nama,
    email,
    passwordHashForEmailChange,
}: UpdateOwnAccountProfileInput) {
    return db.transaction(async (tx) => {
        const lock = db.raw.sql`
            SELECT id FROM public."adminUser"
            WHERE id = ${userId}
            FOR UPDATE
        `.returnsRow({ id: "pg/int4@1" }).build();

        await tx.query(lock);

        const target = await tx.orm.public.AdminUser
            .where({ id: userId })
            .first();

        if (
            !target ||
            !target.isActive ||
            !isAdminRole(target.role) ||
            target.email !== expectedEmail ||
            target.passwordHash !== verifiedPasswordHash
        ) {
            throw new AccountMutationError(
                401,
                "Sesi tidak berlaku. Silakan login kembali.",
            );
        }

        const sessionLock = db.raw.sql`
            SELECT id FROM public."adminSession"
            WHERE "userId" = ${userId}
                AND "tokenHash" = ${sessionTokenHash}
                AND "expiresAt" > clock_timestamp()
            FOR UPDATE
        `.returnsRow({ id: "pg/int4@1" }).build();

        const sessions = await tx.query(sessionLock);
        if (!sessions[0]) {
            throw new AccountMutationError(
                401,
                "Sesi tidak berlaku. Silakan login kembali.",
            );
        }

        const emailChanged = target.email !== email;
        const changedFields: string[] = [];
        if (target.nama !== nama) changedFields.push("nama");
        if (emailChanged) changedFields.push("email");

        let account = target;

        if (changedFields.length > 0) {
            const data: {
                nama: string;
                email: string;
                passwordHash?: string;
            } = { nama, email };

            if (emailChanged) {
                if (
                    !passwordHashForEmailChange ||
                    passwordHashForEmailChange === verifiedPasswordHash
                ) {
                    throw new Error("Hash konfirmasi email tidak valid");
                }

                // Menghentikan pembuatan sesi dengan data login lama.
                data.passwordHash = passwordHashForEmailChange;
            }

            const updated = await tx.orm.public.AdminUser
                .where({ id: userId })
                .update(data);

            if (!updated) {
                throw new AccountMutationError(401, "Akun tidak tersedia.");
            }

            account = updated;

            if (emailChanged) {
                await tx.orm.public.AdminSession
                    .where({ userId })
                    .delete();
            }

            await createAuditLog({
                userId,
                action: "UPDATE",
                entity: "AdminUser",
                entityId: userId,
                details: emailChanged
                    ? `Memperbarui profil akun sendiri: ${changedFields.join(", ")}; email ${target.email} menjadi ${email}. Semua sesi lama dicabut.`
                    : `Memperbarui nama profil akun sendiri dari ${JSON.stringify(target.nama)} menjadi ${JSON.stringify(nama)}.`,
                dbClient: tx,
            });
        }

        const keys = [...new Set([target.email.toLowerCase(), email])].sort();
        for (const key of keys) {
            await tx.orm.public.LoginRateLimit
                .where({ key })
                .delete();
        }

        return {
            account: toAccountDto(account),
            changed: changedFields.length > 0,
            requiresLogin: emailChanged,
        };
    });
}
