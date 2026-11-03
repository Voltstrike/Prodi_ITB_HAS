import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import sharp from "sharp";
import {
    DokumenUploadError,
    MAX_DOKUMEN_UPLOAD_BYTES,
} from "./constants";
import { MAX_IMAGE_UPLOAD_BYTES } from "../media/constants";

const runFile = promisify(execFile);
const MAX_RENDERED_BYTES = 12 * 1024 * 1024;

export async function createPdfThumbnail(pdf: Buffer) {
    if (
        pdf.length === 0 ||
        pdf.length > MAX_DOKUMEN_UPLOAD_BYTES ||
        pdf.subarray(0, 5).toString("ascii") !== "%PDF-"
    ) {
        throw new DokumenUploadError(
            pdf.length > MAX_DOKUMEN_UPLOAD_BYTES ? 413 : 400,
            "Gunakan PDF yang valid dengan ukuran maksimal 10 MB.",
        );
    }

    const directory = await mkdtemp(join(tmpdir(), "mm-itbhas-pdf-"));

    try {
        const source = join(directory, "source.pdf");
        const preview = join(directory, "preview");

        await writeFile(source, pdf, { flag: "wx", mode: 0o600 });

        try {
            await runFile("pdftoppm", [
                "-f", "1",
                "-l", "1",
                "-singlefile",
                "-scale-to", "1600",
                "-png",
                "-hide-annotations",
                source,
                preview,
            ], {
                timeout: 10_000,
                killSignal: "SIGKILL",
                maxBuffer: 256 * 1024,
                windowsHide: true,
            });
        } catch (error) {
            const code = error && typeof error === "object" && "code" in error
                ? error.code
                : null;

            if (code === "ENOENT") {
                throw new DokumenUploadError(
                    503,
                    "Layanan pratinjau PDF belum tersedia. Hubungi pengelola website.",
                );
            }

            if (code === 2 || code === "EACCES") throw error;

            throw new DokumenUploadError(
                400,
                "Pratinjau PDF gagal dibuat. Coba ekspor ulang dokumen sebagai PDF.",
            );
        }

        const previewPath = `${preview}.png`;
        const info = await stat(previewPath);

        if (!info.isFile() || info.size === 0 || info.size > MAX_RENDERED_BYTES) {
            throw new DokumenUploadError(400, "Hasil pratinjau PDF tidak valid.");
        }

        const image = await readFile(previewPath);
        const output = await sharp(image, {
            failOn: "warning",
            limitInputPixels: 1600 * 1600,
        })
            .flatten({ background: "#ffffff" })
            .resize(1200, 750, { fit: "cover", position: "north" })
            .webp({ quality: 85, effort: 4 })
            .timeout({ seconds: 10 })
            .toBuffer({ resolveWithObject: true });

        if (output.data.length === 0 || output.data.length > MAX_IMAGE_UPLOAD_BYTES) {
            throw new DokumenUploadError(413, "Ukuran pratinjau PDF terlalu besar.");
        }

        return {
            data: output.data,
            width: output.info.width,
            height: output.info.height,
        };
    } finally {
        await rm(directory, { recursive: true, force: true });
    }
}
