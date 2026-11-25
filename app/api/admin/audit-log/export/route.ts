import * as XLSX from "xlsx";
import { parseAuditLogFilters, auditLogDateTime } from "@/lib/admin/audit-log-filters";
import { getAuditLogsForExport } from "@/lib/admin/audit-log-list";
import { createAuditLog } from "@/lib/audit/log";
import { requireSuperAdminApi } from "@/lib/auth/require-super-admin-api";
import { requireSameOriginRequest } from "@/lib/http/origin";

const headers = { "Cache-Control": "private, no-store" };

function failure(message: string, status: number) {
    return Response.json({ message }, { status, headers });
}

export async function POST(request: Request) {
    const denied = requireSameOriginRequest(request);
    if (denied) return denied;
    const admin = await requireSuperAdminApi();
    if (!admin) return failure("Akses ditolak.", 403);

    const parsed = parseAuditLogFilters(new URL(request.url).searchParams);
    if (!parsed.ok) return failure(parsed.message, 400);
    const { from, to } = parsed.filters;
    if (!from || !to) return failure("Pilih tanggal mulai dan akhir.", 400);

    try {
        const logs = await getAuditLogsForExport(parsed.filters);
        if (!logs) return failure("Hasil melebihi kapasitas satu lembar Excel. Persempit periode.", 422);
        const sheet = XLSX.utils.aoa_to_sheet([
            ["Waktu (WIB)", "ID catatan", "Admin", "Email", "Tindakan", "Objek", "ID objek", "Detail"],
        ]);
        for (const row of logs) {
            const cells = [auditLogDateTime(row.createdAt), row.id, row.actorName,
                row.actorEmail, row.action, row.entity, row.entityId, row.details];
            if (cells.some(cell => typeof cell === "string" && cell.length > 32767)) {
                return failure(`Catatan #${row.id} melampaui kapasitas teks satu sel Excel.`, 422);
            }
            XLSX.utils.sheet_add_aoa(sheet, [cells], { origin: -1 });
        }
        sheet["!cols"] = [30, 12, 26, 34, 16, 23, 12, 72].map(wch => ({ wch }));
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, sheet, "Audit Log");
        const file: ArrayBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx", compression: true });

        await createAuditLog({
            userId: admin.id, action: "EXPORT", entity: "AuditLog", entityId: 0,
            details: `Ekspor Excel disiapkan untuk ${from} s.d. ${to} WIB (${logs.length} catatan).`,
        });
        return new Response(file, {
            headers: {
                ...headers,
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="audit-log_${from}_sd_${to}.xlsx"`,
            },
        });
    } catch (error) {
        console.error("AUDIT EXPORT ERROR", error instanceof Error ? error.name : "UnknownError");
        return failure("Gagal menyiapkan ekspor audit.", 500);
    }
}
