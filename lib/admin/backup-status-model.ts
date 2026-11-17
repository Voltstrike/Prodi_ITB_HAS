export type BackupServiceState = "success" | "running" | "failed" | "unknown";
export type BackupSnapshot = {
    version: 1;
    generatedAt: string;
    schedule: { active: boolean; nextRunAt: string | null };
    local: {
        state: BackupServiceState;
        lastSuccessAt: string | null;
        availableArchives: number | null;
        latestArchiveBytes: number | null;
    };
    drive: {
        state: BackupServiceState;
        lastSuccessAt: string | null;
        verifiedArchives: number | null;
        recoveryVerified: boolean;
    };
};
export type BackupStatusView = {
    checkedAt: string;
    data: BackupSnapshot | null;
    reason: "missing" | "invalid" | "unreadable" | null;
};

const MINUTE = 60_000;
export const STATUS_STALE_MS = 3 * MINUTE;
export const BACKUP_LATE_MS = 26 * 60 * MINUTE;

function record(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid status");
    return value as Record<string, unknown>;
}
function time(value: unknown): string {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?Z$/.test(value)) throw new Error("Invalid timestamp");
    const parsed = Date.parse(value);
    if (!Number.isFinite(parsed) || new Date(parsed).toISOString().slice(0, 19) !== value.slice(0, 19)) throw new Error("Invalid timestamp");
    return value;
}
function nullableTime(value: unknown): string | null {
    return value === null ? null : time(value);
}
function count(value: unknown): number | null {
    if (value === null) return null;
    if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) throw new Error("Invalid number");
    return value;
}
function state(value: unknown): BackupServiceState {
    if (value !== "success" && value !== "running" && value !== "failed" && value !== "unknown") throw new Error("Invalid service state");
    return value;
}

export function parseBackupSnapshot(value: unknown, nowMs = Date.now()): BackupSnapshot {
    const input = record(value);
    const schedule = record(input.schedule);
    const local = record(input.local);
    const drive = record(input.drive);
    if (input.version !== 1 || typeof schedule.active !== "boolean" || typeof drive.recoveryVerified !== "boolean") throw new Error("Invalid status schema");
    const generatedAt = time(input.generatedAt);
    if (!Number.isFinite(nowMs) || Date.parse(generatedAt) > nowMs + MINUTE) throw new Error("Future status");
    const localSuccess = nullableTime(local.lastSuccessAt);
    const driveSuccess = nullableTime(drive.lastSuccessAt);
    for (const value of [localSuccess, driveSuccess]) {
        if (value && Date.parse(value) > Date.parse(generatedAt) + MINUTE) throw new Error("Future backup");
    }
    const nextRunAt = nullableTime(schedule.nextRunAt);
    if (nextRunAt && Date.parse(nextRunAt) > nowMs + 366 * 24 * 60 * MINUTE) throw new Error("Invalid schedule");
    return {
        version: 1,
        generatedAt,
        schedule: { active: schedule.active, nextRunAt },
        local: {
            state: state(local.state),
            lastSuccessAt: localSuccess,
            availableArchives: count(local.availableArchives),
            latestArchiveBytes: count(local.latestArchiveBytes),
        },
        drive: {
            state: state(drive.state),
            lastSuccessAt: driveSuccess,
            verifiedArchives: count(drive.verifiedArchives),
            recoveryVerified: drive.recoveryVerified,
        },
    };
}

export function parseBackupStatusView(value: unknown): BackupStatusView {
    const input = record(value);
    const checkedAt = time(input.checkedAt);
    if (input.data === null) {
        if (input.reason !== "missing" && input.reason !== "invalid" && input.reason !== "unreadable") throw new Error("Invalid status response");
        return { checkedAt, data: null, reason: input.reason };
    }
    if (input.reason !== null) throw new Error("Invalid status response");
    return { checkedAt, data: parseBackupSnapshot(input.data, Date.parse(checkedAt)), reason: null };
}

export type BackupHealth = "unavailable" | "stale" | "failed" | "running" | "paused" | "pending" | "late" | "unverified" | "healthy";
export function backupHealth(view: BackupStatusView): BackupHealth {
    const data = view.data;
    if (!data) return "unavailable";
    const nowMs = Date.parse(view.checkedAt);
    if (nowMs - Date.parse(data.generatedAt) > STATUS_STALE_MS) return "stale";
    if (data.local.state === "failed" || data.drive.state === "failed") return "failed";
    if (data.local.state === "running" || data.drive.state === "running") return "running";
    if (!data.schedule.active) return "paused";
    if (!data.local.lastSuccessAt || !data.drive.lastSuccessAt || data.local.state !== "success" || data.drive.state !== "success" || !data.schedule.nextRunAt || !(data.local.availableArchives && data.local.latestArchiveBytes && data.drive.verifiedArchives)) return "pending";
    if ([data.local.lastSuccessAt, data.drive.lastSuccessAt].some((value) => nowMs - Date.parse(value) > BACKUP_LATE_MS) || Date.parse(data.schedule.nextRunAt) < nowMs - 5 * MINUTE) return "late";
    if (!data.drive.recoveryVerified) return "unverified";
    return "healthy";
}

export function backupDateTime(value: string | null): string {
    return value ? new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta",
    }).format(new Date(value)) + " WIB" : "Belum ada catatan";
}

export function backupSize(value: number | null): string {
    if (value === null) return "Belum tersedia";
    if (value < 1000) return `${value} B`;
    const units = ["kB", "MB", "GB", "TB", "PB"];
    let size = value / 1000;
    let unit = 0;
    while (size >= 1000 && unit < units.length - 1) { size /= 1000; unit++; }
    return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(size) + " " + units[unit];
}
