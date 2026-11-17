import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { backupStatusResponse } from "@/lib/admin/backup-status-response";
import { readBackupStatus } from "@/lib/admin/backup-status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
    return backupStatusResponse(await requireAdminApi(), readBackupStatus);
}
