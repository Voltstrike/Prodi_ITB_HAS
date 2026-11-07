import type { db } from "@/prisma/db";
import { decryptMfaSecret, recoveryCodeHash, verifyTotpStep } from "./mfa-crypto";

export type MfaTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type MfaProof = { code: string; recovery: boolean };
export type MfaVerificationResult =
    | { status: "verified" }
    | { status: "required" }
    | { status: "invalid" }
    | { status: "blocked"; retryAfterSeconds: number };

export class MfaVerificationError extends Error {
    constructor(
        public readonly kind: "required" | "invalid" | "blocked",
        public readonly retryAfterSeconds = 0,
    ) {
        super("Verifikasi MFA belum berhasil.");
        this.name = "MfaVerificationError";
    }
}

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;
type FailureState = { failedAttempts: number; firstFailedAt: string | null };

export function getMfaRateLimit(state: FailureState, now = Date.now()) {
    if (!Number.isSafeInteger(state.failedAttempts) || state.failedAttempts < 0) {
        throw new Error("Status pembatasan MFA tidak valid.");
    }
    if (state.firstFailedAt === null) {
        if (state.failedAttempts !== 0) {
            throw new Error("Status pembatasan MFA tidak valid.");
        }
        return { allowed: true, retryAfterSeconds: 0 };
    }

    const start = Date.parse(state.firstFailedAt);
    if (!Number.isFinite(start)) {
        throw new Error("Waktu pembatasan MFA tidak valid.");
    }

    const elapsed = Math.max(0, now - start);
    const blocked = elapsed < WINDOW_MS && state.failedAttempts >= MAX_FAILURES;

    return {
        allowed: !blocked,
        retryAfterSeconds: blocked
            ? Math.max(1, Math.ceil((WINDOW_MS - elapsed) / 1000))
            : 0,
    };
}

export async function getMfaState(tx: MfaTransaction, userId: number) {
    return (await tx.orm.public.AdminMfa.where({ userId }).first()) ?? null;
}

export type MfaState = NonNullable<Awaited<ReturnType<typeof getMfaState>>>;

export function isMfaEnabled(
    state: MfaState | null,
): state is MfaState & { enabledAt: string; secretEncrypted: string } {
    if (!state) return false;

    if ((state.enabledAt === null) !== (state.secretEncrypted === null)) {
        throw new Error("Konfigurasi MFA tidak konsisten.");
    }

    return state.enabledAt !== null;
}

// Pemanggil wajib memegang FOR UPDATE pada adminUser yang bersangkutan.
export async function recordMfaFailure(
    tx: MfaTransaction,
    state: MfaState,
    now = Date.now(),
): Promise<MfaVerificationResult> {
    const current = getMfaRateLimit(state, now);
    if (!current.allowed) {
        return { status: "blocked", retryAfterSeconds: current.retryAfterSeconds };
    }

    const first = state.firstFailedAt === null ? 0 : Date.parse(state.firstFailedAt);
    const reset = state.firstFailedAt === null || now - first >= WINDOW_MS;
    const next = {
        failedAttempts: reset ? 1 : state.failedAttempts + 1,
        firstFailedAt: reset ? new Date(now).toISOString() : state.firstFailedAt!,
    };

    await tx.orm.public.AdminMfa.where({ id: state.id }).update(next);

    const limit = getMfaRateLimit(next, now);
    return limit.allowed
        ? { status: "invalid" }
        : { status: "blocked", retryAfterSeconds: limit.retryAfterSeconds };
}

// Wajib berada dalam transaksi pembuat sesi atau perubahan MFA.
export async function verifyAndConsumeMfa(
    tx: MfaTransaction,
    state: MfaState,
    proof?: MfaProof,
): Promise<MfaVerificationResult> {
    if (!isMfaEnabled(state)) throw new Error("MFA belum aktif.");

    const now = Date.now();
    const limit = getMfaRateLimit(state, now);
    if (!limit.allowed) {
        return { status: "blocked", retryAfterSeconds: limit.retryAfterSeconds };
    }
    if (!proof) return { status: "required" };

    const code = proof.code.trim();
    let step: number | null = null;

    if (proof.recovery) {
        const codeHash = recoveryCodeHash(code, state.userId);
        const saved = codeHash
            ? await tx.orm.public.AdminMfaRecoveryCode
                .where({ userId: state.userId, codeHash }).first()
            : null;

        if (!saved) return recordMfaFailure(tx, state, now);

        await tx.orm.public.AdminMfaRecoveryCode.where({ id: saved.id }).delete();
    } else {
        const secret = decryptMfaSecret(state.secretEncrypted, state.userId);
        step = verifyTotpStep(secret, code, state.lastUsedStep ?? -1, now);
        if (step === null) return recordMfaFailure(tx, state, now);
    }

    await tx.orm.public.AdminMfa.where({ id: state.id }).update({
        lastUsedStep: step ?? state.lastUsedStep,
        failedAttempts: 0,
        firstFailedAt: null,
    });

    return { status: "verified" };
}
