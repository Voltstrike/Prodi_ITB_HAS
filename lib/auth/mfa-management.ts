import { createHash, randomBytes } from "node:crypto";
import { db } from "@/prisma/db";
import { isAdminRole } from "./roles";
import {
    createRecoveryCodes,
    createTotpSetup,
    decryptMfaSecret,
    encryptMfaSecret,
    recoveryCodeHash,
    verifyTotpStep,
} from "./mfa-crypto";
import {
    getMfaRateLimit,
    getMfaState,
    isMfaEnabled,
    MfaVerificationError,
    recordMfaFailure,
    verifyAndConsumeMfa,
    type MfaProof,
    type MfaTransaction,
    type MfaVerificationResult,
} from "./mfa-verification";

export type MfaAction = "start" | "confirm" | "cancel" | "regenerate" | "disable";

export async function getMfaSummary(userId: number) {
    const [state, codes] = await Promise.all([
        db.orm.public.AdminMfa.where({ userId }).select("enabledAt").first(),
        db.orm.public.AdminMfaRecoveryCode.where({ userId }).select("id").all(),
    ]);

    return {
        enabled: state?.enabledAt != null,
        recoveryCodesRemaining: codes.length,
    };
}

export class MfaManagementError extends Error {
    constructor(public readonly status: number, message: string) {
        super(message);
        this.name = "MfaManagementError";
    }
}

type Payload =
    | { kind: "setup"; secret: string; uri: string; expiresAt: string }
    | { kind: "cancelled"; enabled: false }
    | {
        kind: "enabled" | "regenerated";
        enabled: true;
        recoveryCodes: string[];
        recoveryCodesRemaining: number;
    }
    | { kind: "disabled"; enabled: false; recoveryCodesRemaining: number };

type Success = {
    status: "success";
    payload: Payload;
    session?: { token: string; expiresAt: string };
};

type Outcome = Success | MfaVerificationResult;

async function replaceRecoveryCodes(tx: MfaTransaction, userId: number) {
    const remove = db.raw.sql`
        DELETE FROM public."adminMfaRecoveryCode"
        WHERE "userId" = ${userId} RETURNING id
    `.returnsRow({ id: "pg/int4@1" }).build();

    await tx.query(remove);

    const codes = createRecoveryCodes();
    for (const code of codes) {
        const codeHash = recoveryCodeHash(code, userId);
        if (!codeHash) throw new Error("Pembuatan kode pemulihan gagal.");
        await tx.orm.public.AdminMfaRecoveryCode.create({ userId, codeHash });
    }

    return codes;
}

async function rotateSession(
    tx: MfaTransaction,
    userId: number,
    mfaVersion: number,
    expiresAt: string,
) {
    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");

    const remove = db.raw.sql`
        DELETE FROM public."adminSession"
        WHERE "userId" = ${userId} RETURNING id
    `.returnsRow({ id: "pg/int4@1" }).build();

    await tx.query(remove);
    await tx.orm.public.AdminSession.create({
        userId, tokenHash, mfaVersion, expiresAt,
    });

    return { token, expiresAt };
}

export async function runMfaAction(input: {
    userId: number;
    sessionTokenHash: string;
    verifiedPasswordHash: string;
    action: MfaAction;
    proof?: MfaProof;
}): Promise<Success> {
    const result = await db.transaction<Outcome>(async (tx) => {
        const lock = db.raw.sql`
            SELECT id FROM public."adminUser"
            WHERE id = ${input.userId} FOR UPDATE
        `.returnsRow({ id: "pg/int4@1" }).build();

        await tx.query(lock);

        const user = await tx.orm.public.AdminUser
            .where({ id: input.userId }).first();

        if (
            !user ||
            !user.isActive ||
            !isAdminRole(user.role) ||
            user.passwordHash !== input.verifiedPasswordHash
        ) {
            throw new MfaManagementError(401, "Silakan login kembali.");
        }

        let mfa = await getMfaState(tx, user.id);

        const session = await tx.orm.public.AdminSession
            .where({ userId: user.id, tokenHash: input.sessionTokenHash })
            .first();

        if (
            !session ||
            !Number.isFinite(Date.parse(session.expiresAt)) ||
            Date.parse(session.expiresAt) <= Date.now() ||
            session.mfaVersion !== (mfa?.version ?? 0)
        ) {
            throw new MfaManagementError(401, "Silakan login kembali.");
        }

        if (!mfa) {
            mfa = await tx.orm.public.AdminMfa.create({ userId: user.id });
        }

        const limit = getMfaRateLimit(mfa);
        if (!limit.allowed) {
            return { status: "blocked", retryAfterSeconds: limit.retryAfterSeconds };
        }

        if (input.action === "start") {
            if (isMfaEnabled(mfa)) {
                throw new MfaManagementError(409, "MFA sudah aktif.");
            }

            const setup = createTotpSetup(
                process.env.NODE_ENV === "production"
                    ? user.email
                    : `${user.email} (Lokal)`,
            );
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

            await tx.orm.public.AdminMfa.where({ id: mfa.id }).update({
                pendingSecretEncrypted: encryptMfaSecret(setup.secret, user.id),
                pendingExpiresAt: expiresAt,
                pendingSessionTokenHash: input.sessionTokenHash,
            });

            return {
                status: "success",
                payload: { kind: "setup", ...setup, expiresAt },
            };
        }

        if (input.action === "cancel") {
            if (isMfaEnabled(mfa)) {
                throw new MfaManagementError(409, "MFA sudah aktif.");
            }

            if (
                mfa.pendingSessionTokenHash !== null &&
                mfa.pendingSessionTokenHash !== input.sessionTokenHash
            ) {
                throw new MfaManagementError(
                    409,
                    "Pengaturan MFA dimulai dari sesi berbeda.",
                );
            }

            await tx.orm.public.AdminMfa.where({ id: mfa.id }).update({
                pendingSecretEncrypted: null,
                pendingExpiresAt: null,
                pendingSessionTokenHash: null,
            });

            return {
                status: "success",
                payload: { kind: "cancelled", enabled: false },
            };
        }

        const nextVersion = mfa.version + 1;
        let payload: Payload;

        if (input.action === "confirm") {
            if (isMfaEnabled(mfa)) {
                throw new MfaManagementError(409, "MFA sudah aktif.");
            }

            if (
                !mfa.pendingSecretEncrypted ||
                !mfa.pendingExpiresAt ||
                !Number.isFinite(Date.parse(mfa.pendingExpiresAt)) ||
                Date.parse(mfa.pendingExpiresAt) <= Date.now() ||
                mfa.pendingSessionTokenHash !== input.sessionTokenHash
            ) {
                throw new MfaManagementError(
                    410,
                    "Pengaturan kedaluwarsa atau berasal dari sesi berbeda. Mulai ulang aktivasi MFA.",
                );
            }

            if (!input.proof) return { status: "required" };

            const step = input.proof.recovery ? null : verifyTotpStep(
                decryptMfaSecret(mfa.pendingSecretEncrypted, user.id),
                input.proof.code.trim(),
            );

            if (step === null) return recordMfaFailure(tx, mfa);

            await tx.orm.public.AdminMfa.where({ id: mfa.id }).update({
                secretEncrypted: mfa.pendingSecretEncrypted,
                enabledAt: new Date().toISOString(),
                pendingSecretEncrypted: null,
                pendingExpiresAt: null,
                pendingSessionTokenHash: null,
                lastUsedStep: step,
                version: nextVersion,
                failedAttempts: 0,
                firstFailedAt: null,
            });

            const codes = await replaceRecoveryCodes(tx, user.id);
            payload = {
                kind: "enabled",
                enabled: true,
                recoveryCodes: codes,
                recoveryCodesRemaining: codes.length,
            };
        } else {
            if (!isMfaEnabled(mfa)) {
                throw new MfaManagementError(409, "MFA belum aktif.");
            }

            const verified = await verifyAndConsumeMfa(tx, mfa, input.proof);
            if (verified.status !== "verified") return verified;

            if (input.action === "disable") {
                await tx.orm.public.AdminMfa.where({ id: mfa.id }).update({
                    secretEncrypted: null,
                    enabledAt: null,
                    lastUsedStep: null,
                    pendingSecretEncrypted: null,
                    pendingExpiresAt: null,
                    pendingSessionTokenHash: null,
                    version: nextVersion,
                    failedAttempts: 0,
                    firstFailedAt: null,
                });

                const remove = db.raw.sql`
                    DELETE FROM public."adminMfaRecoveryCode"
                    WHERE "userId" = ${user.id} RETURNING id
                `.returnsRow({ id: "pg/int4@1" }).build();

                await tx.query(remove);
                payload = {
                    kind: "disabled",
                    enabled: false,
                    recoveryCodesRemaining: 0,
                };
            } else {
                const codes = await replaceRecoveryCodes(tx, user.id);
                await tx.orm.public.AdminMfa
                    .where({ id: mfa.id }).update({ version: nextVersion });

                payload = {
                    kind: "regenerated",
                    enabled: true,
                    recoveryCodes: codes,
                    recoveryCodesRemaining: codes.length,
                };
            }
        }

        const renewed = await rotateSession(
            tx, user.id, nextVersion, session.expiresAt,
        );

        await tx.orm.public.AuditLog.create({
            userId: user.id,
            action: "UPDATE",
            entity: "AdminMfa",
            entityId: mfa.id,
            details: payload.kind === "enabled"
                ? "MFA diaktifkan."
                : payload.kind === "disabled"
                    ? "MFA dinonaktifkan."
                    : "Kode pemulihan MFA diperbarui.",
        });

        return { status: "success", payload, session: renewed };
    });

    if (result.status === "success") return result;

    if (result.status === "blocked") {
        throw new MfaVerificationError("blocked", result.retryAfterSeconds);
    }

    if (result.status === "required" || result.status === "invalid") {
        throw new MfaVerificationError(result.status);
    }

    throw new Error("Hasil perubahan MFA tidak valid.");
}
