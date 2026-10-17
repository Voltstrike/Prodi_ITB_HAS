import { readMedia } from "@/lib/media/storage";

export const runtime = "nodejs";

type Context = { params: Promise<{ filename: string }> };

async function serve(request: Request, context: Context, head: boolean) {
    try {
        const { filename } = await context.params;
        const etag = `"${filename}"`;
        const notModified = request.headers.get("if-none-match") === etag;
        const file = await readMedia(filename, head || notModified);

        if (!file) {
            return new Response(head ? null : "Gambar tidak ditemukan.", {
                status: 404,
                headers: { "Cache-Control": "no-store" },
            });
        }

        const headers = new Headers({
            "Content-Type": "image/webp",
            "Content-Length": String(file.size),
            "Cache-Control": "public, max-age=31536000, immutable",
            "X-Content-Type-Options": "nosniff",
            "Content-Disposition": `inline; filename="${filename}"`,
            "ETag": etag,
        });

        if (notModified) {
            headers.delete("Content-Length");
            return new Response(null, { status: 304, headers });
        }

        return new Response(
            head || !file.data ? null : new Uint8Array(file.data),
            { headers },
        );
    } catch (error) {
        console.error(
            "MEDIA READ ERROR:",
            error instanceof Error ? error.name : "UnknownError",
        );
        return new Response(head ? null : "Gambar tidak dapat dimuat.", {
            status: 500,
            headers: { "Cache-Control": "no-store" },
        });
    }
}

export async function GET(request: Request, context: Context) {
    return serve(request, context, false);
}

export async function HEAD(request: Request, context: Context) {
    return serve(request, context, true);
}
