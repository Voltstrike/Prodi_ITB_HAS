import { requireSuperAdminApi } from "@/lib/auth/require-super-admin-api";
import { parseAuditLogFilters } from "@/lib/admin/audit-log-filters";
import { getAuditLogsPage } from "@/lib/admin/audit-log-list";

export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
    const admin = await requireSuperAdminApi();

    if (!admin) {
        return Response.json(
            { message: "Akses ditolak" },
            { status: 403, headers },
        );
    }

    const parsed = parseAuditLogFilters(new URL(request.url).searchParams);

    if (!parsed.ok) {
        return Response.json(
            { message: parsed.message },
            { status: 400, headers },
        );
    }

    try {
        const result = await getAuditLogsPage(parsed.filters);
        return Response.json(result, { headers });
    } catch (error) {
        console.error(
            "AUDIT LOG READ ERROR:",
            error instanceof Error ? error.name : "UnknownError",
        );

        return Response.json(
            { message: "Gagal mengambil catatan audit." },
            { status: 500, headers },
        );
    }
}
