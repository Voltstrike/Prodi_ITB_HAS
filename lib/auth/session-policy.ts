export const SESSION_ABSOLUTE_TIMEOUT_MS = 8 * 60 * 60 * 1000;
export const SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000;
export const SESSION_WARNING_MS = 2 * 60 * 1000;
export const SESSION_ACTIVITY_INTERVAL_MS = 30 * 1000;

export type SessionTimestamps = {
    createdAt: string;
    expiresAt: string;
    lastActivityAt: string;
};

export function getSessionDeadlines(
    session: SessionTimestamps,
) {
    const createdAt = Date.parse(session.createdAt);
    const storedExpiresAt = Date.parse(session.expiresAt);
    const lastActivityAt = Date.parse(
        session.lastActivityAt,
    );

    if (
        ![
            createdAt,
            storedExpiresAt,
            lastActivityAt,
        ].every(Number.isFinite) ||
        storedExpiresAt <= createdAt ||
        lastActivityAt < createdAt
    ) {
        return null;
    }

    const absoluteExpiresAt = Math.min(
        storedExpiresAt,
        createdAt + SESSION_ABSOLUTE_TIMEOUT_MS,
    );

    const idleExpiresAt =
        lastActivityAt + SESSION_IDLE_TIMEOUT_MS;

    return {
        absoluteExpiresAt,
        idleExpiresAt,
        expiresAt: Math.min(
            absoluteExpiresAt,
            idleExpiresAt,
        ),
    };
}

export function isSessionExpired(
    session: SessionTimestamps,
    now = Date.now(),
) {
    const deadlines = getSessionDeadlines(session);

    return !Number.isFinite(now) ||
        deadlines === null ||
        deadlines.expiresAt <= now;
}
