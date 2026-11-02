import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { readJsonObjectBody } from "@/lib/http/json";
import { requireSameOriginRequest } from "@/lib/http/origin";
import {
    ImageUploadError,
    isMediaFileName,
} from "@/lib/media/constants";
import {
    cropUploadedImage,
    parseCropArea,
} from "@/lib/media/crop";
import { isImageCropAspect } from "@/lib/media/crop-types";
import { readMedia, saveMedia } from "@/lib/media/storage";

export const runtime = "nodejs";

const MAX_CROP_BODY_BYTES = 4 * 1024;
const activeCrops = new Set<number>();

function jsonResponse(
    body: unknown,
    status = 200,
    extraHeaders: Record<string, string> = {},
) {
    return Response.json(body, {
        status,
        headers: {
            "Cache-Control": "no-store",
            ...extraHeaders,
        },
    });
}

export async function POST(request: Request) {
    const originError = requireSameOriginRequest(request);

    if (originError) {
        return originError;
    }

    const admin = await requireAdminApi();

    if (!admin) {
        return jsonResponse(
            { message: "Silakan login kembali." },
            401,
        );
    }

    if (activeCrops.has(admin.id) || activeCrops.size >= 2) {
        return jsonResponse(
            {
                message:
                    "Pemrosesan foto sedang berlangsung. Coba lagi sebentar.",
            },
            429,
            { "Retry-After": "2" },
        );
    }

    activeCrops.add(admin.id);

    try {
        const bodyResult = await readJsonObjectBody(
            request,
            MAX_CROP_BODY_BYTES,
        );

        if (!bodyResult.ok) {
            return bodyResult.response;
        }

        const body = bodyResult.body;
        const filename = body.filename;
        const area = parseCropArea(body.area);
        const aspect = body.aspect;

        if (
            typeof filename !== "string" ||
            !isMediaFileName(filename)
        ) {
            return jsonResponse(
                { message: "Foto sumber tidak valid." },
                400,
            );
        }

        if (!area || !isImageCropAspect(aspect)) {
            return jsonResponse(
                {
                    message:
                        "Area atau rasio pemotongan tidak valid.",
                },
                400,
            );
        }

        const source = await readMedia(filename);

        if (
            !source?.data ||
            source.data.length !== source.size
        ) {
            return jsonResponse(
                { message: "Foto sumber tidak ditemukan." },
                404,
            );
        }

        const cropped = await cropUploadedImage(
            source.data,
            area,
            aspect,
        );

        const croppedFilename = await saveMedia(cropped.data);

        return jsonResponse(
            {
                url: `/media/${croppedFilename}`,
                width: cropped.width,
                height: cropped.height,
                size: cropped.data.length,
            },
            201,
        );
    } catch (error) {
        if (error instanceof ImageUploadError) {
            return jsonResponse(
                { message: error.message },
                error.status,
            );
        }

        console.error(
            "IMAGE CROP ERROR:",
            error instanceof Error ? error.name : "UnknownError",
        );

        return jsonResponse(
            {
                message:
                    "Foto gagal dipotong. Silakan coba kembali.",
            },
            500,
        );
    } finally {
        activeCrops.delete(admin.id);
    }
}
