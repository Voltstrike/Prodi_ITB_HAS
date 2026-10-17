import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { listOrganizationPeople } from "@/lib/organization/people";

export async function GET() {
    const admin = await requireAdminApi();

    if (!admin) {
        return Response.json(
            { error: "Silakan login kembali." },
            { status: 401 },
        );
    }

    try {
        const people = await listOrganizationPeople();

        return Response.json(people, {
            headers: { "Cache-Control": "no-store" },
        });
    } catch (error) {
        console.error(
            "ORGANIZATION PEOPLE ERROR:",
            error instanceof Error ? error.name : "UnknownError",
        );

        return Response.json(
            { error: "Gagal memuat pilihan Dosen dan Staff." },
            { status: 500 },
        );
    }
}
