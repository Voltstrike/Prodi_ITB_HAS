import { db } from "@/prisma/db";
import { requireSuperAdminApi } from "@/lib/auth/require-super-admin-api";
import { hashPassword } from "@/lib/auth/password";
import { createAuditLog } from "@/lib/audit/log";
import { readJsonObjectBody } from "@/lib/http/json";
import {
    AccountMutationError,
    isSameOriginRequest,
    toAccountDto,
    validateAccountPassword,
} from "@/lib/admin/accounts";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const admin = await requireSuperAdminApi();
    if (!admin) {
        return Response.json({ message: "Akses ditolak" }, { status: 403 });
    }
    if (!isSameOriginRequest(request)) {
        return Response.json({ message: "Origin tidak diizinkan" }, { status: 403 });
    }

    try {
        const { id } = await params;
        const accountId = Number(id);
        if (
            id !== String(accountId) ||
            !Number.isSafeInteger(accountId) ||
            accountId <= 0 ||
            accountId > 2147483647
        ) {
            return Response.json({ message: "ID akun tidak valid" }, { status: 400 });
        }

        const result = await readJsonObjectBody(request, 8 * 1024);
        if (!result.ok) return result.response;
        const body = result.body;

        let data: { isActive: boolean } | { passwordHash: string };
        let operation: string;

        if (body.action === "set-active") {
            if (
                typeof body.isActive !== "boolean" ||
                Object.keys(body).some((key) => !["action", "isActive"].includes(key))
            ) {
                return Response.json({ message: "Status akun tidak valid" }, { status: 400 });
            }
            data = { isActive: body.isActive };
            operation = body.isActive ? "Mengaktifkan" : "Menonaktifkan";
        } else if (body.action === "reset-password") {
            if (Object.keys(body).some((key) => !["action", "password"].includes(key))) {
                return Response.json({ message: "Field reset password tidak valid" }, { status: 400 });
            }
            const password = typeof body.password === "string" ? body.password : "";
            const invalid = validateAccountPassword(password);
            if (invalid) {
                return Response.json({ message: invalid }, { status: 400 });
            }
            data = { passwordHash: await hashPassword(password) };
            operation = "Mereset password";
        } else {
            return Response.json({ message: "Aksi tidak valid" }, { status: 400 });
        }

        const account = await db.transaction(async (tx) => {
            const lock = db.raw.sql`
                SELECT id FROM public."adminUser"
                WHERE id = ${accountId}
                FOR UPDATE
            `.returnsRow({ id: "pg/int4@1" }).build();
            await tx.query(lock);

            const target = await tx.orm.public.AdminUser
                .where({ id: accountId })
                .first();

            if (!target) {
                throw new AccountMutationError(404, "Akun tidak ditemukan");
            }
            if (target.id === admin.id || target.role !== "ADMIN") {
                throw new AccountMutationError(403, "Akun Super Admin tidak dapat diubah dari panel ini");
            }

            const updated = await tx.orm.public.AdminUser
                .where({ id: accountId })
                .update(data);
            if (!updated) {
                throw new AccountMutationError(404, "Akun tidak ditemukan");
            }

            await tx.orm.public.AdminSession
                .where({ userId: accountId })
                .delete();
            await tx.orm.public.LoginRateLimit
                .where({ key: target.email.toLowerCase() })
                .delete();

            await createAuditLog({
                userId: admin.id,
                action: "UPDATE",
                entity: "AdminUser",
                entityId: accountId,
                details: `${operation} akun ${target.email}; sesi lama dicabut.`,
                dbClient: tx,
            });

            return updated;
        });

        return Response.json(toAccountDto(account));
    } catch (error) {
        if (error instanceof AccountMutationError) {
            return Response.json({ message: error.message }, { status: error.status });
        }
        console.error("UPDATE ACCOUNT ERROR:", error instanceof Error ? error.name : "UnknownError");
        return Response.json({ message: "Gagal mengubah akun" }, { status: 500 });
    }
}
