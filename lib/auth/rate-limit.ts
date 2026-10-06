import { db } from "@/prisma/db";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;

async function getRecord(key: string) {
    const rows = await db.orm.public.LoginRateLimit
        .where({ key })
        .all();

    return rows[0] ?? null;
}

function getRateLimitState(
    count: number,
    firstAttemptAt: string
) {
    const now = Date.now();
    const firstAttempt = new Date(firstAttemptAt).getTime();

    if (
        !Number.isFinite(firstAttempt) ||
        now - firstAttempt >= WINDOW_MS
    ) {
        return {
            allowed: true,
            retryAfterSeconds: 0,
        };
    }

    if (count >= MAX_FAILED_ATTEMPTS) {
        return {
            allowed: false,
            retryAfterSeconds: Math.max(
                1,
                Math.ceil(
                    (
                        WINDOW_MS -
                        (now - firstAttempt)
                    ) / 1000
                )
            ),
        };
    }

    return {
        allowed: true,
        retryAfterSeconds: 0,
    };
}

export async function checkLoginRateLimit(key: string) {
    const record = await getRecord(key);

    if (!record) {
        return {
            allowed: true,
            retryAfterSeconds: 0,
        };
    }

    return getRateLimitState(
        record.count,
        record.firstAttemptAt
    );
}

export async function recordLoginFailure(key: string) {
    const plan = db.raw.sql`
        INSERT INTO public."loginRateLimit"
            ("key", "count", "firstAttemptAt", "updatedAt")
        VALUES
            (${key}, 1, now(), now())
        ON CONFLICT ("key")
        DO UPDATE SET
            "count" = CASE
                WHEN now() - "loginRateLimit"."firstAttemptAt"
                    >= interval '15 minutes'
                THEN 1
                ELSE "loginRateLimit"."count" + 1
            END,
            "firstAttemptAt" = CASE
                WHEN now() - "loginRateLimit"."firstAttemptAt"
                    >= interval '15 minutes'
                THEN now()
                ELSE "loginRateLimit"."firstAttemptAt"
            END,
            "updatedAt" = now()
        RETURNING "count", "firstAttemptAt"
    `.returnsRow({
        count: "pg/int4@1",
        firstAttemptAt: "pg/timestamptz-string@1",
    }).build();

    const rows = await db.runtime().query(plan);
    const record = rows[0];

    if (!record) {
        throw new Error(
            "Gagal mencatat percobaan login"
        );
    }

    return getRateLimitState(
        record.count,
        record.firstAttemptAt
    );
}

export async function clearLoginFailures(key: string) {
    await db.orm.public.LoginRateLimit
        .where({ key })
        .delete();
}
