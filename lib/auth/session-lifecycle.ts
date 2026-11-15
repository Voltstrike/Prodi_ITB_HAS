import { db } from "@/prisma/db";
import { isAdminRole } from "./roles";
import { getSessionDeadlines } from "./session-policy";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Reader = Pick<Transaction, "orm">;

// Membaca sesi tidak pernah memperpanjang batas aktivitas.
async function readActive(reader: Reader, tokenHash: string) {
    if (!/^[a-f0-9]{64}$/.test(tokenHash)) return null;

    const session = await reader.orm.public.AdminSession
        .where({ tokenHash }).first();
    if (!session) return null;

    const user = await reader.orm.public.AdminUser
        .where({ id: session.userId }).first();
    if (!user || !user.isActive || !isAdminRole(user.role)) return null;

    const mfa = await reader.orm.public.AdminMfa
        .where({ userId: user.id }).select("version").first();
    if (session.mfaVersion !== (mfa?.version ?? 0)) return null;

    const deadlines = getSessionDeadlines(session);
    const serverNow = Date.now();
    if (!deadlines || deadlines.expiresAt <= serverNow) return null;

    return { user, session, deadlines, serverNow };
}

export async function readActiveAdminSession(tokenHash: string) {
    return readActive(db, tokenHash);
}

export type ActiveAdminSession = NonNullable<
    Awaited<ReturnType<typeof readActiveAdminSession>>
>;

// Hanya identitas sesi dan waktu; jangan kirim token/passwordHash ke klien.
export function publicSessionState(state: ActiveAdminSession) {
    return {
        sessionId: state.session.id,
        serverNow: state.serverNow,
        ...state.deadlines,
    };
}

export async function recordAdminActivity(
    tokenHash: string,
    expectedSessionId: number,
) {
    if (
        !/^[a-f0-9]{64}$/.test(tokenHash) ||
        !Number.isSafeInteger(expectedSessionId) || expectedSessionId <= 0
    ) return { kind: "expired" } as const;

    return db.transaction(async (tx) => {
        // Urutan kunci sama dengan login/perubahan MFA: pengguna, lalu sesi.
        await tx.query(db.raw.sql`
            SELECT id FROM public."adminUser"
            WHERE id = (
                SELECT "userId" FROM public."adminSession"
                WHERE "tokenHash" = ${tokenHash}
            ) FOR UPDATE
        `.returnsRow({ id: "pg/int4@1" }).build());

        await tx.query(db.raw.sql`
            SELECT id FROM public."adminSession"
            WHERE "tokenHash" = ${tokenHash} FOR UPDATE
        `.returnsRow({ id: "pg/int4@1" }).build());

        // Periksa waktu setelah menunggu kunci; sesi habis tidak boleh hidup lagi.
        const state = await readActive(tx, tokenHash);
        if (!state) return { kind: "expired" } as const;
        if (state.session.id !== expectedSessionId) {
            return { kind: "changed" } as const;
        }

        const lastActivityAt = new Date(Math.max(
            state.serverNow,
            Date.parse(state.session.lastActivityAt),
        )).toISOString();

        await tx.orm.public.AdminSession
            .where({ id: state.session.id }).update({ lastActivityAt });

        const session = { ...state.session, lastActivityAt };
        const deadlines = getSessionDeadlines(session)!;
        return {
            kind: "active",
            state: publicSessionState({ ...state, session, deadlines }),
        } as const;
    });
}
