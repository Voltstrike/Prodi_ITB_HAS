import sharp from "sharp";
import { ImageUploadError, MAX_IMAGE_UPLOAD_BYTES } from "@/lib/media/constants";

type Format = "jpeg" | "png" | "webp";

function detectFormat(input: Buffer): Format | null {
    if (input.length >= 3 &&
        input[0] === 0xff && input[1] === 0xd8 && input[2] === 0xff) {
        return "jpeg";
    }
    if (input.subarray(0, 8).equals(
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    )) {
        return "png";
    }
    if (input.length >= 12 &&
        input.toString("ascii", 0, 4) === "RIFF" &&
        input.toString("ascii", 8, 12) === "WEBP") {
        return "webp";
    }
    return null;
}

export async function normalizeUploadedImage(file: File) {
    if (file.size === 0 || file.size > MAX_IMAGE_UPLOAD_BYTES) {
        throw new ImageUploadError(
            file.size === 0 ? 400 : 413,
            "Pilih foto berukuran maksimal 5 MB.",
        );
    }

    const extension = file.name.slice(file.name.lastIndexOf(".") + 1).toLowerCase();
    const extensions: Record<string, Format> = {
        jpg: "jpeg", jpeg: "jpeg", png: "png", webp: "webp",
    };
    const expected = Object.hasOwn(extensions, extension)
        ? extensions[extension]
        : undefined;

    const input = Buffer.from(await file.arrayBuffer());
    const format = detectFormat(input);
    const mime: Record<Format, string> = {
        jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
    };

    if (!format || format !== expected ||
        (file.type && file.type !== mime[format])) {
        throw new ImageUploadError(
            415,
            "Isi berkas harus sesuai format JPG, PNG, atau WebP.",
        );
    }

    try {
        const image = sharp(input, {
            failOn: "warning",
            limitInputPixels: 25_000_000,
        });
        const metadata = await image.metadata();

        if (metadata.format !== format ||
            !metadata.width || !metadata.height ||
            metadata.width > 12_000 || metadata.height > 12_000 ||
            metadata.width * metadata.height > 25_000_000 ||
            (metadata.pages ?? 1) > 1) {
            throw new ImageUploadError(
                400,
                "Gunakan foto statis dengan resolusi maksimal 25 megapiksel dan sisi maksimal 12.000 piksel.",
            );
        }

        const output = await image.rotate()
            .resize({
                width: 1600,
                height: 1600,
                fit: "inside",
                withoutEnlargement: true,
            })
            .webp({ quality: 85, effort: 4 })
            .timeout({ seconds: 10 })
            .toBuffer({ resolveWithObject: true });

        if (output.data.length > MAX_IMAGE_UPLOAD_BYTES) {
            throw new ImageUploadError(
                413,
                "Hasil pemrosesan foto terlalu besar. Kecilkan foto terlebih dahulu.",
            );
        }

        return {
            data: output.data,
            width: output.info.width,
            height: output.info.height,
        };
    } catch (error) {
        if (error instanceof ImageUploadError) throw error;
        throw new ImageUploadError(
            400,
            "Foto tidak dapat dibaca atau resolusinya terlalu besar. Coba foto lain atau kecilkan resolusinya.",
        );
    }
}
