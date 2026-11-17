import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { readBackupStatus } from "@/lib/admin/backup-status";
import BackupStatusPanel from "@/components/admin/BackupStatusPanel";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function BackupStatusPage() {
    await requireSuperAdmin();
    return <BackupStatusPanel initial={await readBackupStatus()} />;
}
