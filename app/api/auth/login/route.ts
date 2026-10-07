import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
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

export async function POST(request: Request) {
    const bodyResult = await readJsonObjectBody(
        request,
        MAX_LOGIN_BODY_BYTES
    );

    if (!bodyResult.ok) {
        return bodyResult.response;
    }

    const body = bodyResult.body;

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

    if (!user) {
        return Response.json(
            { message: "Email atau password salah" },
            { status: 401 }
        );
    }

    const passwordValid = await verifyPassword(
        password,
        user.passwordHash
    );

    if (!passwordValid) {
        const failureLimit =
            await recordLoginFailure(rateLimitKey);

        if (!failureLimit.allowed) {
            return new Response(
                JSON.stringify({
                    message:
                        "Terlalu banyak percobaan login. Silakan coba lagi nanti.",
                }),
                {
                    status: 429,
                    headers: {
                        "Content-Type": "application/json",
                        "Retry-After": String(
                            failureLimit.retryAfterSeconds
                        ),
                    },
                }
            );
        }

        return Response.json(
            { message: "Email atau password salah" },
            { status: 401 }
        );
    }

    await clearLoginFailures(rateLimitKey);

    await createSession(user.id);

    return Response.json({
        message: "Login berhasil",
    });
}
