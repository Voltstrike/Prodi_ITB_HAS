import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { requireSameOriginRequest } from "@/lib/http/origin";
import { ImageUploadError } from "@/lib/media/constants";
import { readImageUpload } from "@/lib/media/multipart";
import { normalizeUploadedImage } from "@/lib/media/image";
import { saveMedia } from "@/lib/media/storage";

export const runtime = "nodejs";

const activeUploads = new Set<number>();

export async function POST(request: Request) {
    const originError = requireSameOriginRequest(request);
    if (originError) return originError;

    const admin = await requireAdminApi();
    if (!admin) {
        return Response.json(
            { message: "Silakan login kembali." },
            { status: 401, headers: { "Cache-Control": "no-store" } },
        );
    }

    if (activeUploads.has(admin.id) || activeUploads.size >= 2) {
        return Response.json(
            { message: "Unggahan sedang diproses. Coba lagi sebentar." },
            {
                status: 429,
                headers: {
                    "Retry-After": "2",
                    "Cache-Control": "no-store",
                },
            },
        );
    }

    activeUploads.add(admin.id);

    try {
        const file = await readImageUpload(request);
        const image = await normalizeUploadedImage(file);
        const filename = await saveMedia(image.data);

        return Response.json(
            {
                url: `/media/${filename}`,
                width: image.width,
                height: image.height,
                size: image.data.length,
            },
            { status: 201, headers: { "Cache-Control": "no-store" } },
        );
    } catch (error) {
        if (error instanceof ImageUploadError) {
            return Response.json(
                { message: error.message },
                {
                    status: error.status,
                    headers: { "Cache-Control": "no-store" },
                },
            );
        }

        console.error(
            "IMAGE UPLOAD ERROR:",
            error instanceof Error ? error.name : "UnknownError",
        );
        return Response.json(
            { message: "Foto gagal disimpan. Silakan coba kembali." },
            { status: 500, headers: { "Cache-Control": "no-store" } },
        );
    } finally {
        activeUploads.delete(admin.id);
    }
}
