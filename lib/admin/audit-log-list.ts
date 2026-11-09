import { db } from "@/prisma/db";
import {
    AUDIT_LOG_PAGE_SIZE,
    escapeAuditLike,
    type AuditLogFilters,
} from "@/lib/admin/audit-log-filters";

export type AuditLogRow = {
    id: number;
    userId: number;
    actorName: string;
    actorEmail: string;
    action: string;
    entity: string;
    entityId: number;
    details: string;
    createdAt: string;
};

export type AuditLogPage = {
    logs: AuditLogRow[];
    total: number;
    page: number;
    totalPages: number;
    pageSize: number;
};

export async function getAuditLogsPage(
    filters: AuditLogFilters,
): Promise<AuditLogPage> {
    const searchPattern = `%${escapeAuditLike(filters.q)}%`;
    const actorPattern = `%${escapeAuditLike(filters.actor)}%`;
    const fromInstant = filters.fromInstant ?? "";
    const toExclusiveInstant = filters.toExclusiveInstant ?? "";

    const plan = db.raw.sql`
        WITH filtered AS MATERIALIZED (
            SELECT log.id, log."createdAt"
            FROM public."auditLog" AS log
            JOIN public."adminUser" AS actor
              ON actor.id = log."userId"
            WHERE
                (${filters.action}::text = ''
                    OR log.action = ${filters.action}::text)
                AND (${filters.entity}::text = ''
                    OR log.entity = ${filters.entity}::text)
                AND (
                    ${filters.actor}::text = ''
                    OR actor.nama ILIKE ${actorPattern}::text ESCAPE chr(92)
                    OR actor.email ILIKE ${actorPattern}::text ESCAPE chr(92)
                )
                AND (
                    ${filters.q}::text = ''
                    OR log.details ILIKE ${searchPattern}::text ESCAPE chr(92)
                    OR log.entity ILIKE ${searchPattern}::text ESCAPE chr(92)
                    OR log."entityId"::text
                        ILIKE ${searchPattern}::text ESCAPE chr(92)
                )
                AND (
                    NULLIF(${fromInstant}::text, '')::timestamptz IS NULL
                    OR log."createdAt" >= NULLIF(${fromInstant}::text, '')::timestamptz
                )
                AND (
                    NULLIF(${toExclusiveInstant}::text, '')::timestamptz IS NULL
                    OR log."createdAt" < NULLIF(${toExclusiveInstant}::text, '')::timestamptz
                )
        ),
        totals AS (
            SELECT count(*)::integer AS total FROM filtered
        ),
        bounds AS (
            SELECT
                total,
                GREATEST(
                    1,
                    ((total::bigint + ${AUDIT_LOG_PAGE_SIZE - 1})
                        / ${AUDIT_LOG_PAGE_SIZE})::integer
                ) AS "totalPages"
            FROM totals
        ),
        chosen AS (
            SELECT
                total,
                "totalPages",
                LEAST(
                    ${String(filters.page)}::numeric,
                    "totalPages"::numeric
                )::integer AS page
            FROM bounds
        )
        SELECT
            COALESCE(item.id, 0)::integer AS id,
            chosen.total,
            chosen.page,
            chosen."totalPages"
        FROM chosen
        LEFT JOIN LATERAL (
            SELECT id, "createdAt"
            FROM filtered
            ORDER BY "createdAt" DESC, id DESC
            LIMIT ${AUDIT_LOG_PAGE_SIZE}
            OFFSET ((chosen.page - 1)::bigint * ${AUDIT_LOG_PAGE_SIZE})
        ) AS item ON true
        ORDER BY item."createdAt" DESC, item.id DESC
    `.returnsRow({
        id: "pg/int4@1",
        total: "pg/int4@1",
        page: "pg/int4@1",
        totalPages: "pg/int4@1",
    }).build();

    const records = await db.runtime().query(plan);
    const metadata = records[0];

    if (!metadata) {
        throw new Error("Metadata pagination audit tidak tersedia.");
    }

    const result: AuditLogPage = {
        logs: [],
        total: metadata.total,
        page: metadata.page,
        totalPages: metadata.totalPages,
        pageSize: AUDIT_LOG_PAGE_SIZE,
    };

    const ids = records.map((record) => record.id).filter((id) => id > 0);
    if (ids.length === 0) return result;

    const logs = await db.orm.public.AuditLog
        .where((row) => row.id.in(ids))
        .select(
            "id", "userId", "action", "entity",
            "entityId", "details", "createdAt",
        )
        .all();

    const userIds = [...new Set(logs.map((log) => log.userId))];
    if (userIds.length === 0) return result;

    const actors = await db.orm.public.AdminUser
        .where((row) => row.id.in(userIds))
        .select("id", "nama", "email")
        .all();

    const actorById = new Map(actors.map((actor) => [actor.id, actor]));
    const logById = new Map(logs.map((log) => [log.id, log]));

    for (const id of ids) {
        const log = logById.get(id);
        if (!log) continue;

        const actor = actorById.get(log.userId);

        result.logs.push({
            id: log.id,
            userId: log.userId,
            actorName: actor?.nama ?? "Admin tidak tersedia",
            actorEmail: actor?.email ?? "",
            action: log.action,
            entity: log.entity,
            entityId: log.entityId,
            details: log.details,
            createdAt: log.createdAt,
        });
    }

    return result;
}
