import { isSuperAdminRole } from "../auth/roles";
import type { BackupStatusView } from "./backup-status-model";

const headers = { "Cache-Control": "private, no-store", "Vary": "Cookie" };

export async function backupStatusResponse(
    user: { role: string } | null,
    readStatus: () => Promise<BackupStatusView>,
): Promise<Response> {
    if (!user || !isSuperAdminRole(user.role)) {
        return Response.json({ message: "Akses ditolak" }, { status: 403, headers });
    }
    return Response.json(await readStatus(), { headers });
}
