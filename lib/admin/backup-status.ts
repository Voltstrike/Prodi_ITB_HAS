import { constants } from "node:fs";
import { open } from "node:fs/promises";
import { isAbsolute } from "node:path";
import { parseBackupSnapshot, type BackupStatusView } from "./backup-status-model";

export const MAX_BACKUP_STATUS_BYTES = 16 * 1024;

export async function readBackupStatus(
    file = process.env.BACKUP_STATUS_FILE || "/data/backup-status/status.json",
    nowMs = Date.now(),
): Promise<BackupStatusView> {
    const checkedAt = new Date(nowMs).toISOString();
    const unavailable = (reason: BackupStatusView["reason"]): BackupStatusView => ({ checkedAt, data: null, reason });
    if (!isAbsolute(file)) return unavailable("invalid");
    try {
        const handle = await open(
            /* turbopackIgnore: true */ file,
            constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK,
        );
        try {
            const info = await handle.stat();
            if (!info.isFile() || info.size === 0 || info.size > MAX_BACKUP_STATUS_BYTES) return unavailable("invalid");
            const buffer = Buffer.alloc(MAX_BACKUP_STATUS_BYTES + 1);
            let bytesRead = 0;
            while (bytesRead < buffer.length) {
                const chunk = await handle.read(buffer, bytesRead, buffer.length - bytesRead, bytesRead);
                if (!chunk.bytesRead) break;
                bytesRead += chunk.bytesRead;
            }
            if (!bytesRead || bytesRead > MAX_BACKUP_STATUS_BYTES) return unavailable("invalid");
            try {
                const data = parseBackupSnapshot(JSON.parse(buffer.subarray(0, bytesRead).toString("utf8")), nowMs);
                return { checkedAt, data, reason: null };
            } catch {
                return unavailable("invalid");
            }
        } finally {
            await handle.close();
        }
    } catch (error) {
        const code = error && typeof error === "object" && "code" in error ? error.code : null;
        return unavailable(code === "ENOENT" || code === "ENOTDIR" ? "missing" : "unreadable");
    }
}
