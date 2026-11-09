export const AUDIT_LOG_PAGE_SIZE = 25;

export type AuditLogFilters = {
    page: number;
    q: string;
    actor: string;
    action: string;
    entity: string;
    from: string;
    to: string;
    fromInstant: string | null;
    toExclusiveInstant: string | null;
};

type FilterResult =
    | { ok: true; filters: AuditLogFilters }
    | { ok: false; message: string };

const fields = ["page", "q", "actor", "action", "entity", "from", "to"] as const;
const dayMs = 24 * 60 * 60 * 1000;

function isValidDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const year = Number(value.slice(0, 4));
    if (year < 1 || year > 9998) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function parseAuditLogFilters(params: URLSearchParams): FilterResult {
    for (const field of fields) {
        if (params.getAll(field).length > 1) {
            return { ok: false, message: "Parameter filter tidak boleh berulang." };
        }
    }

    const rawPage = params.get("page") ?? "1";
    const page = Number(rawPage);
    if (!/^[1-9]\d{0,15}$/.test(rawPage) || !Number.isSafeInteger(page)) {
        return { ok: false, message: "Nomor halaman tidak valid." };
    }

    const q = (params.get("q") ?? "").trim();
    const actor = (params.get("actor") ?? "").trim();
    const action = (params.get("action") ?? "").trim();
    const entity = (params.get("entity") ?? "").trim();
    const from = (params.get("from") ?? "").trim();
    const to = (params.get("to") ?? "").trim();

    if (q.length > 200 || actor.length > 100) {
        return {
            ok: false,
            message: "Pencarian maksimal 200 karakter dan nama/email admin maksimal 100 karakter.",
        };
    }

    if ([...q, ...actor].some((character) => {
        const code = character.charCodeAt(0);
        return code < 32 || code === 127;
    })) {
        return { ok: false, message: "Teks pencarian mengandung karakter yang tidak valid." };
    }

    if (action && !/^[A-Za-z][A-Za-z0-9_]{0,39}$/.test(action)) {
        return { ok: false, message: "Filter tindakan tidak valid." };
    }

    if (entity && !/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(entity)) {
        return { ok: false, message: "Filter objek tidak valid." };
    }

    if ((from && !isValidDate(from)) || (to && !isValidDate(to))) {
        return { ok: false, message: "Tanggal filter tidak valid." };
    }

    if (from && to && from > to) {
        return { ok: false, message: "Tanggal mulai tidak boleh melewati tanggal akhir." };
    }

    return {
        ok: true,
        filters: {
            page, q, actor, action, entity, from, to,
            fromInstant: from
                ? new Date(`${from}T00:00:00+07:00`).toISOString()
                : null,
            toExclusiveInstant: to
                ? new Date(
                    new Date(`${to}T00:00:00+07:00`).getTime() + dayMs,
                ).toISOString()
                : null,
        },
    };
}

export function escapeAuditLike(value: string): string {
    return value.replace(/[\\%_]/g, "\\$&");
}

export function auditLogHref(
    filters: AuditLogFilters,
    page: number = filters.page,
): string {
    if (!Number.isSafeInteger(page) || page < 1) {
        throw new RangeError("Nomor halaman tidak valid.");
    }

    const params = new URLSearchParams();

    for (const field of ["q", "actor", "action", "entity", "from", "to"] as const) {
        if (filters[field]) params.set(field, filters[field]);
    }

    if (page > 1) params.set("page", String(page));

    const query = params.toString();
    return `/admin/audit-log${query ? `?${query}` : ""}`;
}

export function auditLogDateTime(value: string): string {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return "Waktu tidak tersedia";

    return new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        dateStyle: "medium",
        timeStyle: "medium",
        hourCycle: "h23",
    }).format(date) + " WIB";
}
