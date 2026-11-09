import QRCode from "qrcode";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { getSessionTokenHash, replaceMfaSessionCookie } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { checkLoginRateLimit, recordLoginFailure } from "@/lib/auth/rate-limit";
import { requireSameOriginRequest } from "@/lib/http/origin";
import { readJsonObjectBody } from "@/lib/http/json";
import {
    getMfaSummary,
    MfaManagementError,
    runMfaAction,
    type MfaAction,
} from "@/lib/auth/mfa-management";
import { MfaVerificationError } from "@/lib/auth/mfa-verification";

function mfaJson(
    body: Record<string, unknown>,
    status = 200,
    headers: Record<string, string> = {},
) {
    return Response.json(body, {
        status,
        headers: { "Cache-Control": "no-store", ...headers },
    });
}

function blocked(seconds: number) {
    return mfaJson(
        { message: "Terlalu banyak percobaan verifikasi. Silakan coba lagi nanti." },
        429,
        { "Retry-After": String(seconds) },
    );
}

export async function GET() {
    try {
        const user = await requireAdminApi();
        if (!user) {
            return mfaJson(
                { message: "Silakan login kembali.", requiresLogin: true },
                401,
            );
        }

        return mfaJson(await getMfaSummary(user.id));
    } catch (error) {
        console.error(
            "MFA STATUS ERROR:",
            error instanceof Error ? error.name : "UnknownError",
        );
        return mfaJson({ message: "Status MFA gagal dibaca." }, 500);
    }
}

export async function POST(request: Request) {
    const originError = requireSameOriginRequest(request);
    if (originError) {
        originError.headers.set("Cache-Control", "no-store");
        return originError;
    }

    try {
        const user = await requireAdminApi();
        const sessionTokenHash = user ? await getSessionTokenHash() : null;

        if (!user || !sessionTokenHash) {
            return mfaJson(
                { message: "Silakan login kembali.", requiresLogin: true },
                401,
            );
        }

        const parsed = await readJsonObjectBody(request, 4 * 1024);
        if (!parsed.ok) {
            parsed.response.headers.set("Cache-Control", "no-store");
            return parsed.response;
        }

        const body = parsed.body;
        const allowed = ["action", "currentPassword", "mfaCode", "useRecoveryCode"];
        const actions: readonly string[] = [
            "start", "confirm", "cancel", "regenerate", "disable",
        ];

        if (
            Object.keys(body).some((key) => !allowed.includes(key)) ||
            typeof body.action !== "string" ||
            !actions.includes(body.action) ||
            typeof body.currentPassword !== "string" ||
            !body.currentPassword ||
            body.currentPassword.length > 128 ||
            (body.mfaCode !== undefined &&
                (typeof body.mfaCode !== "string" || body.mfaCode.length > 64)) ||
            (body.useRecoveryCode !== undefined &&
                typeof body.useRecoveryCode !== "boolean")
        ) {
            return mfaJson({ message: "Input pengaturan MFA tidak valid." }, 400);
        }

        const key = `mfa-settings-password:${user.id}`;
        const limit = await checkLoginRateLimit(key);
        if (!limit.allowed) return blocked(limit.retryAfterSeconds);

        if (!(await verifyPassword(body.currentPassword, user.passwordHash))) {
            const failure = await recordLoginFailure(key);
            return failure.allowed
                ? mfaJson({ message: "Password saat ini salah." }, 401)
                : blocked(failure.retryAfterSeconds);
        }

        const result = await runMfaAction({
            userId: user.id,
            sessionTokenHash,
            verifiedPasswordHash: user.passwordHash,
            action: body.action as MfaAction,
            proof: typeof body.mfaCode === "string"
                ? { code: body.mfaCode, recovery: body.useRecoveryCode === true }
                : undefined,
        });

        if (result.session) {
            await replaceMfaSessionCookie(
                result.session.token,
                result.session.expiresAt,
            );
        }

        const payload = result.payload;
        if (payload.kind === "setup") {
            const qrCodeDataUrl = await QRCode.toDataURL(payload.uri, {
                errorCorrectionLevel: "M",
                margin: 4,
                width: 256,
            });

            return mfaJson({
                kind: "setup",
                secret: payload.secret,
                qrCodeDataUrl,
                expiresAt: payload.expiresAt,
                message: "Pindai QR, lalu masukkan kode Authenticator untuk mengaktifkan MFA.",
            });
        }

        return mfaJson({
            ...payload,
            message: payload.kind === "enabled"
                ? "MFA aktif. Simpan kode pemulihan Anda."
                : payload.kind === "regenerated"
                    ? "Kode pemulihan baru berhasil dibuat."
                    : payload.kind === "disabled"
                        ? "MFA dinonaktifkan."
                        : "Pengaturan MFA dibatalkan.",
        });
    } catch (error) {
        if (error instanceof MfaManagementError) {
            return mfaJson({
                message: error.message,
                requiresLogin: error.status === 401,
            }, error.status);
        }

        if (error instanceof MfaVerificationError) {
            if (error.kind === "blocked") return blocked(error.retryAfterSeconds);

            return mfaJson({
                message: error.kind === "required"
                    ? "Kode verifikasi wajib diisi."
                    : "Kode tidak valid, kedaluwarsa, atau sudah digunakan.",
            }, error.kind === "required" ? 400 : 401);
        }

        console.error(
            "MFA SETTINGS ERROR:",
            error instanceof Error ? error.name : "UnknownError",
        );

        return mfaJson(
            { message: "Pengaturan MFA gagal diproses. Silakan coba lagi." },
            500,
        );
    }
}
