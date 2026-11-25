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
    return readAuditLogs(filters, AUDIT_LOG_PAGE_SIZE);
}

export async function getAuditLogsForExport(filters: AuditLogFilters) {
    // One worksheet has 1,048,576 rows, including its header.
    const capacity = 1_048_575;
    const result = await readAuditLogs({ ...filters, page: 1 }, capacity);
    if (result.total > capacity) return null;
    return result.logs;
}

async function readAuditLogs(
    filters: AuditLogFilters,
    pageSize: number,
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
                    ((total::bigint + ${pageSize - 1})
                        / ${pageSize})::integer
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
            COALESCE(log."userId", 0) AS "userId",
            COALESCE(actor.nama, '') AS "actorName",
            COALESCE(actor.email, '') AS "actorEmail",
            COALESCE(log.action, '') AS action,
            COALESCE(log.entity, '') AS entity,
            COALESCE(log."entityId", 0) AS "entityId",
            COALESCE(log.details, '') AS details,
            COALESCE(item."createdAt", 'epoch'::timestamptz) AS "createdAt",
            chosen.total,
            chosen.page,
            chosen."totalPages"
        FROM chosen
        LEFT JOIN LATERAL (
            SELECT id, "createdAt"
            FROM filtered
            WHERE chosen.total <= ${pageSize} OR ${pageSize === AUDIT_LOG_PAGE_SIZE}::boolean
            ORDER BY "createdAt" DESC, id DESC
            LIMIT ${pageSize}
            OFFSET ((chosen.page - 1)::bigint * ${pageSize})
        ) AS item ON true
        LEFT JOIN public."auditLog" AS log ON log.id = item.id
        LEFT JOIN public."adminUser" AS actor ON actor.id = log."userId"
        ORDER BY item."createdAt" DESC, item.id DESC
    `.returnsRow({
        id: "pg/int4@1",
        userId: "pg/int4@1",
        actorName: "pg/text@1",
        actorEmail: "pg/text@1",
        action: "pg/text@1",
        entity: "pg/text@1",
        entityId: "pg/int4@1",
        details: "pg/text@1",
        createdAt: "pg/timestamptz-string@1",
        total: "pg/int4@1",
        page: "pg/int4@1",
        totalPages: "pg/int4@1",
    }).build();

    const records = await db.runtime().query(plan);
    const metadata = records[0];

    if (!metadata) {
        throw new Error("Metadata pagination audit tidak tersedia.");
    }

    return {
        logs: records.filter(row => row.id > 0).map(row => ({
            id: row.id,
            userId: row.userId,
            actorName: row.actorName,
            actorEmail: row.actorEmail,
            action: row.action,
            entity: row.entity,
            entityId: row.entityId,
            details: row.details,
            createdAt: row.createdAt,
        })),
        total: metadata.total,
        page: metadata.page,
        totalPages: metadata.totalPages,
        pageSize,
    };
}
