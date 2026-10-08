import { createSessionRecord } from "@/lib/auth/session-record";
import { isAdminRole } from "@/lib/auth/roles";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/prisma/db";

const SESSION_COOKIE = "admin_session";
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 jam

function hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
}

export async function createSession(
    userId: number,
    verifiedPasswordHash: string,
): Promise<boolean> {
    const cookieStore = await cookies();
    const token = randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + SESSION_DURATION);

    const created = await createSessionRecord({
        userId,
        verifiedPasswordHash,
        tokenHash,
        expiresAt: expiresAt.toISOString(),
    });

    if (!created) {
        return false;
    }

    cookieStore.set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: expiresAt,
    });

    return true;
}

export async function getSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (!token) {
        return null;
    }

    const tokenHash = hashToken(token);

    const session = await db.orm.public.AdminSession
        .where({ tokenHash })
        .first();

    if (!session) {
        return null;
    }

    if (new Date(session.expiresAt).getTime() <= Date.now()) {
        await db.orm.public.AdminSession
            .where({ id: session.id })
            .delete();

        return null;
    }

    const user = await db.orm.public.AdminUser
        .where({ id: session.userId })
        .first();

    if (!user || !user.isActive || !isAdminRole(user.role)) {
        return null;
    }

    return user;
}

export async function deleteSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (token) {
        const tokenHash = hashToken(token);

        const session = await db.orm.public.AdminSession
            .where({ tokenHash })
            .first();

        if (session) {
            await db.orm.public.AdminSession
                .where({ id: session.id })
                .delete();
        }
    }

    cookieStore.delete(SESSION_COOKIE);
}
