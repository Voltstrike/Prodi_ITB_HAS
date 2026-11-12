import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { parseMediaLibraryFilters } from "@/lib/media/library-filters";
import { getMediaLibraryPage } from "@/lib/media/library";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = {
    "Cache-Control": "private, no-store",
};

export async function GET(request: Request) {
    const admin = await requireAdminApi();

    if (!admin) {
        return Response.json(
            { message: "Silakan login kembali." },
            { status: 401, headers },
        );
    }

    const parsed = parseMediaLibraryFilters(
        new URL(request.url).searchParams,
    );

    if (!parsed.ok) {
        return Response.json(
            { message: parsed.message },
            { status: 400, headers },
        );
    }

    try {
        const result = await getMediaLibraryPage(
            parsed.filters,
        );

        return Response.json(result, { headers });
    } catch (error) {
        console.error(
            "MEDIA LIBRARY READ ERROR:",
            error instanceof Error
                ? error.name
                : "UnknownError",
        );

        return Response.json(
            {
                message:
                    "Pustaka media gagal dimuat. Silakan coba kembali.",
            },
            { status: 500, headers },
        );
    }
}
