import sharp from "sharp";
import {
    ImageUploadError,
    MAX_IMAGE_UPLOAD_BYTES,
} from "./constants";
import {
    IMAGE_CROP_PRESETS,
    isImageCropAspect,
    type CropAreaPixels,
    type ImageCropAspect,
} from "./crop-types";

const MAX_SOURCE_SIDE = 1600;

function isPixel(
    value: unknown,
    minimum = 0,
): value is number {
    return (
        typeof value === "number" &&
        Number.isSafeInteger(value) &&
        value >= minimum &&
        value <= MAX_SOURCE_SIDE
    );
}

export function parseCropArea(
    value: unknown,
): CropAreaPixels | null {
    if (
        value === null ||
        typeof value !== "object" ||
        Array.isArray(value)
    ) {
        return null;
    }

    const area = value as Record<string, unknown>;

    if (
        !isPixel(area.x) ||
        !isPixel(area.y) ||
        !isPixel(area.width, 1) ||
        !isPixel(area.height, 1)
    ) {
        return null;
    }

    return {
        x: area.x,
        y: area.y,
        width: area.width,
        height: area.height,
    };
}

export async function cropUploadedImage(
    input: Buffer,
    area: CropAreaPixels,
    aspect: ImageCropAspect,
) {
    const crop = parseCropArea(area);

    if (!crop || !isImageCropAspect(aspect)) {
        throw new ImageUploadError(
            400,
            "Area pemotongan foto tidak valid.",
        );
    }

    if (input.length === 0) {
        throw new ImageUploadError(
            400,
            "Foto sumber tidak valid.",
        );
    }

    if (input.length > MAX_IMAGE_UPLOAD_BYTES) {
        throw new ImageUploadError(
            413,
            "Ukuran foto maksimal 5 MB.",
        );
    }

    try {
        const image = sharp(input, {
            failOn: "warning",
            limitInputPixels: MAX_SOURCE_SIDE * MAX_SOURCE_SIDE,
        });

        const metadata = await image.metadata();

        if (
            metadata.format !== "webp" ||
            !metadata.width ||
            !metadata.height ||
            metadata.width > MAX_SOURCE_SIDE ||
            metadata.height > MAX_SOURCE_SIDE ||
            (metadata.pages ?? 1) > 1
        ) {
            throw new ImageUploadError(
                400,
                "Gunakan foto yang sudah diproses melalui uploader.",
            );
        }

        if (
            crop.x + crop.width > metadata.width ||
            crop.y + crop.height > metadata.height
        ) {
            throw new ImageUploadError(
                400,
                "Area pemotongan berada di luar foto.",
            );
        }

        const preset = IMAGE_CROP_PRESETS[aspect];

        // Toleransi pembulatan koordinat dari editor crop.
        if (
            Math.abs(
                crop.width -
                crop.height * preset.width / preset.height,
            ) > 2
        ) {
            throw new ImageUploadError(
                400,
                "Area pemotongan tidak sesuai rasio bingkai.",
            );
        }

        const output = await image
            .extract({
                left: crop.x,
                top: crop.y,
                width: crop.width,
                height: crop.height,
            })
            .resize({
                width: preset.width,
                height: preset.height,
                fit: "cover",
                withoutEnlargement: true,
            })
            .webp({ quality: 85, effort: 4 })
            .timeout({ seconds: 10 })
            .toBuffer({ resolveWithObject: true });

        if (output.data.length > MAX_IMAGE_UPLOAD_BYTES) {
            throw new ImageUploadError(
                413,
                "Hasil pemotongan foto terlalu besar.",
            );
        }

        return {
            data: output.data,
            width: output.info.width,
            height: output.info.height,
        };
    } catch (error) {
        if (error instanceof ImageUploadError) {
            throw error;
        }

        throw new ImageUploadError(
            400,
            "Foto gagal dipotong. Coba pilih area lainnya.",
        );
    }
}
