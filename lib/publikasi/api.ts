import { hasSqlState } from "@/lib/admin/accounts";
import { readJsonObjectBody } from "@/lib/http/json";
import { PublicationNotFoundError } from "./management";
import { validatePublikasiInput } from "./validation";

export function publicationJson(
    body: unknown,
    status = 200,
): Response {
    return Response.json(body, {
        status,
        headers: { "Cache-Control": "private, no-store" },
    });
}

export async function readPublicationInput(request: Request) {
    const result = await readJsonObjectBody(request, 64 * 1024);

    if (!result.ok) {
        result.response.headers.set("Cache-Control", "private, no-store");
        return { ok: false as const, response: result.response };
    }

    const validation = validatePublikasiInput(result.body);

    if (!validation.ok) {
        return {
            ok: false as const,
            response: publicationJson(
                { message: validation.message },
                400,
            ),
        };
    }

    return { ok: true as const, data: validation.data };
}

export function publicationErrorResponse(error: unknown): Response {
    if (error instanceof PublicationNotFoundError) {
        return publicationJson(
            { message: "Publikasi tidak ditemukan." },
            404,
        );
    }

    if (hasSqlState(error, "23505")) {
        return publicationJson(
            { message: "DOI atau identitas publikasi sudah digunakan." },
            409,
        );
    }

    console.error(
        "PUBLICATION API ERROR:",
        error instanceof Error ? error.name : "UnknownError",
    );

    return publicationJson(
        { message: "Gagal memproses publikasi. Silakan coba lagi." },
        500,
    );
}
