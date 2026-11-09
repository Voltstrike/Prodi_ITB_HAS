import { requireSameOriginRequest } from "@/lib/http/origin";
import { isAdminRole } from "@/lib/auth/roles";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { MfaVerificationError, type MfaProof } from "@/lib/auth/mfa-verification";
import {
    checkLoginRateLimit,
    clearLoginFailures,
    recordLoginFailure,
} from "@/lib/auth/rate-limit";
import { readJsonObjectBody } from "@/lib/http/json";
import { db } from "@/prisma/db";

const MAX_EMAIL_LENGTH = 254;
const MAX_PASSWORD_LENGTH = 128;
const MAX_LOGIN_BODY_BYTES = 4 * 1024;

async function loginFailureResponse(key: string) {
    const limit = await recordLoginFailure(key);

    if (!limit.allowed) {
        return Response.json(
            {
                message: "Terlalu banyak percobaan login. Silakan coba lagi nanti.",
            },
            {
                status: 429,
                headers: {
                    "Retry-After": String(limit.retryAfterSeconds),
                },
            },
        );
    }

    return Response.json(
        { message: "Email atau password salah" },
        { status: 401 },
    );
}

async function login(request: Request) {
    const originError = requireSameOriginRequest(request);
    if (originError) {
        return originError;
    }

    const bodyResult = await readJsonObjectBody(
        request,
        MAX_LOGIN_BODY_BYTES
    );

    if (!bodyResult.ok) {
        return bodyResult.response;
    }

    const body = bodyResult.body;

    if (
        (body.mfaCode !== undefined &&
            (typeof body.mfaCode !== "string" || body.mfaCode.length > 64)) ||
        (body.useRecoveryCode !== undefined && typeof body.useRecoveryCode !== "boolean")
    ) {
        return Response.json(
            { message: "Format verifikasi MFA tidak valid." },
            { status: 400 },
        );
    }

    const mfaProof: MfaProof | undefined = typeof body.mfaCode === "string"
        ? { code: body.mfaCode, recovery: body.useRecoveryCode === true }
        : undefined;

    const email =
        typeof body.email === "string" ? body.email.trim() : "";
    const password =
        typeof body.password === "string" ? body.password : "";

    if (
        !email ||
        !password ||
        email.length > MAX_EMAIL_LENGTH ||
        password.length > MAX_PASSWORD_LENGTH
    ) {
        return Response.json(
            { message: "Email atau password salah" },
            { status: 401 }
        );
    }

    const rateLimitKey = email.toLowerCase();
    const rateLimit = await checkLoginRateLimit(rateLimitKey);

    if (!rateLimit.allowed) {
        return new Response(
            JSON.stringify({
                message: "Terlalu banyak percobaan login. Silakan coba lagi nanti.",
            }),
            {
                status: 429,
                headers: {
                    "Content-Type": "application/json",
                    "Retry-After": String(rateLimit.retryAfterSeconds),
                },
            }
        );
    }

    const user = await db.orm.public.AdminUser
        .where({ email: rateLimitKey })
        .first();

    if (!user || !user.isActive || !isAdminRole(user.role)) {
        return loginFailureResponse(rateLimitKey);
    }

    const passwordValid = await verifyPassword(
        password,
        user.passwordHash
    );

    if (!passwordValid) {
        return loginFailureResponse(rateLimitKey);
    }

    const sessionCreated = await createSession(
        user.id,
        user.passwordHash,
        mfaProof,
    );

    if (!sessionCreated) {
        return loginFailureResponse(rateLimitKey);
    }

    await clearLoginFailures(rateLimitKey);

    return Response.json({
        message: "Login berhasil",
    });
}

export async function POST(request: Request) {
    try {
        const response = await login(request);
        response.headers.set("Cache-Control", "no-store");
        return response;
    } catch (error) {
        if (error instanceof MfaVerificationError) {
            const blocked = error.kind === "blocked";
            return Response.json({
                requiresMfa: true,
                message: error.kind === "required"
                    ? "Masukkan kode dari aplikasi Authenticator."
                    : blocked
                        ? "Terlalu banyak percobaan MFA. Silakan coba lagi nanti."
                        : "Kode tidak valid, kedaluwarsa, atau sudah digunakan.",
            }, {
                status: error.kind === "required" ? 200 : blocked ? 429 : 401,
                headers: {
                    "Cache-Control": "no-store",
                    ...(blocked ? { "Retry-After": String(error.retryAfterSeconds) } : {}),
                },
            });
        }

        console.error(
            "ADMIN LOGIN ERROR:",
            error instanceof Error ? error.name : "UnknownError",
        );

        return Response.json(
            { message: "Login gagal diproses. Silakan coba lagi." },
            { status: 500, headers: { "Cache-Control": "no-store" } },
        );
    }
}
