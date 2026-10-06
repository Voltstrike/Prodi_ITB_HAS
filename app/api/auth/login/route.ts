import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import {
    checkLoginRateLimit,
    clearLoginFailures,
    recordLoginFailure,
} from "@/lib/auth/rate-limit";
import { db } from "@/prisma/db";

const MAX_EMAIL_LENGTH = 254;
const MAX_PASSWORD_LENGTH = 128;

export async function POST(request: Request) {
    const body = await request.json();

    const email = body.email?.toString().trim() ?? "";
    const password = body.password?.toString() ?? "";

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

    const users = await db.orm.public.AdminUser.all();

    const user = users.find(
        (item) => item.email.toLowerCase() === rateLimitKey
    );

    if (!user) {
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
