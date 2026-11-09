import { requireSameOriginRequest } from "@/lib/http/origin";
import { createPublication } from "@/lib/publikasi/management";
import {
    publicationJson,
    publicationErrorResponse,
    readPublicationInput,
} from "@/lib/publikasi/api";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { parsePublicationFilters } from "@/lib/publikasi/filters";
import { getAdminPublicationsPage } from "@/lib/publikasi/queries";

export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
    const admin = await requireAdminApi();

    if (!admin) {
        return Response.json(
            { message: "Akses ditolak." },
            { status: 403, headers },
        );
    }

    const parsed = parsePublicationFilters(
        new URL(request.url).searchParams,
        "admin",
    );

    if (!parsed.ok) {
        return Response.json(
            { message: parsed.message },
            { status: 400, headers },
        );
    }

    try {
        return Response.json(
            await getAdminPublicationsPage(parsed.filters),
            { headers },
        );
    } catch (error) {
        console.error(
            "PUBLICATION READ ERROR:",
            error instanceof Error ? error.name : "UnknownError",
        );

        return Response.json(
            { message: "Gagal mengambil daftar publikasi." },
            { status: 500, headers },
        );
    }
}

export async function POST(request: Request) {
    const originError = requireSameOriginRequest(request);
    if (originError) {
        originError.headers.set("Cache-Control", "private, no-store");
        return originError;
    }

    const admin = await requireAdminApi();
    if (!admin) {
        return publicationJson({ message: "Akses ditolak." }, 403);
    }

    try {
        const input = await readPublicationInput(request);
        if (!input.ok) return input.response;

        const publication = await createPublication(admin.id, input.data);
        return publicationJson(publication, 201);
    } catch (error) {
        return publicationErrorResponse(error);
    }
}
