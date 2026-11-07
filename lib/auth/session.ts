import { createSessionRecord } from "@/lib/auth/session-record";
import type { MfaProof } from "@/lib/auth/mfa-verification";
import { isAdminRole } from "@/lib/auth/roles";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/prisma/db";

const SESSION_COOKIE = "admin_session";
const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 jam

export async function replaceMfaSessionCookie(token: string, expiresAt: string) {
    const expires = new Date(expiresAt);
    if (!/^[a-f0-9]{64}$/.test(token) || !Number.isFinite(expires.getTime())) {
        throw new Error("Sesi MFA tidak valid.");
    }

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires,
    });
}

function hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
}

export async function createSession(
    userId: number,
    verifiedPasswordHash: string,
    mfaProof?: MfaProof,
): Promise<boolean> {
    const cookieStore = await cookies();
    const token = randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + SESSION_DURATION);

    const created = await createSessionRecord({
        userId,
        verifiedPasswordHash,
        mfaProof,
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

export async function getSessionTokenHash(): Promise<string | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    return token ? hashToken(token) : null;
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

    const mfa = await db.orm.public.AdminMfa
        .where({ userId: user.id }).select("version").first();

    if (session.mfaVersion !== (mfa?.version ?? 0)) {
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
