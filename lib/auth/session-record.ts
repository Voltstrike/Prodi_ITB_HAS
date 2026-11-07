import { db } from "@/prisma/db";
import { isAdminRole } from "@/lib/auth/roles";
import {
    getMfaState,
    isMfaEnabled,
    MfaVerificationError,
    verifyAndConsumeMfa,
    type MfaProof,
    type MfaVerificationResult,
} from "./mfa-verification";

type CreateSessionRecordInput = {
    userId: number;
    verifiedPasswordHash: string;
    tokenHash: string;
    expiresAt: string;
    mfaProof?: MfaProof;
};

export async function createSessionRecord({
    userId,
    verifiedPasswordHash,
    tokenHash,
    expiresAt,
    mfaProof,
}: CreateSessionRecordInput): Promise<boolean> {
    const result = await db.transaction<
        { status: "created" | "user-invalid" } | MfaVerificationResult
    >(async (tx) => {
        const lock = db.raw.sql`
            SELECT id FROM public."adminUser"
            WHERE id = ${userId}
            FOR UPDATE
        `.returnsRow({ id: "pg/int4@1" }).build();

        await tx.query(lock);

        const user = await tx.orm.public.AdminUser
            .where({ id: userId })
            .select("passwordHash", "role", "isActive")
            .first();

        if (
            !user ||
            !user.isActive ||
            !isAdminRole(user.role) ||
            user.passwordHash !== verifiedPasswordHash
        ) {
            return { status: "user-invalid" };
        }

        const mfa = await getMfaState(tx, userId);
        if (isMfaEnabled(mfa)) {
            const verified = await verifyAndConsumeMfa(tx, mfa, mfaProof);
            if (verified.status !== "verified") return verified;
        }

        await tx.orm.public.AdminSession.create({
            userId,
            tokenHash,
            expiresAt,
            mfaVersion: mfa?.version ?? 0,
        });

        return { status: "created" };
    });

    // Lempar setelah transaksi selesai agar percobaan gagal tetap tercatat.
    if (result.status === "created") return true;
    if (result.status === "user-invalid") return false;

    if (result.status === "required" || result.status === "invalid") {
        throw new MfaVerificationError(result.status);
    }

    if (result.status === "blocked") {
        throw new MfaVerificationError("blocked", result.retryAfterSeconds);
    }

    throw new Error("Hasil pembuatan sesi tidak valid.");
}
