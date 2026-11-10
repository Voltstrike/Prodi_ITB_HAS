import { hasSqlState } from "@/lib/admin/accounts";
import { readJsonObjectBody } from "@/lib/http/json";
import { BeritaMutationError } from "./management";

export function beritaJson(body: unknown, status = 200): Response {
    return Response.json(body, {
        status,
        headers: { "Cache-Control": "no-store" },
    });
}

export async function readBeritaBody(request: Request) {
    const result = await readJsonObjectBody(request, 256 * 1024);

    if (!result.ok) {
        result.response.headers.set("Cache-Control", "no-store");
        return { ok: false as const, response: result.response };
    }

    return { ok: true as const, body: result.body };
}

export function beritaErrorResponse(error: unknown): Response {
    if (error instanceof BeritaMutationError) {
        return beritaJson({ message: error.message }, error.status);
    }

    if (hasSqlState(error, "23505")) {
        return beritaJson(
            { message: "Slug berita sudah digunakan. Silakan coba lagi." },
            409,
        );
    }

    console.error(
        "BERITA API ERROR:",
        error instanceof Error ? error.name : "UnknownError",
    );

    return beritaJson({ message: "Gagal memproses berita." }, 500);
}
