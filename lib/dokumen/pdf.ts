import { Buffer } from "node:buffer";
import { PDFDocument } from "pdf-lib";
import {
    DokumenUploadError,
    MAX_DOKUMEN_UPLOAD_BYTES,
    MAX_NAMA_ASLI_DOKUMEN_LENGTH,
} from "./constants";

export async function validateUploadedPdf(
    file: File,
): Promise<{ data: Buffer; namaAsli: string }> {
    if (file.size === 0) {
        throw new DokumenUploadError(400, "Berkas PDF kosong.");
    }

    if (file.size > MAX_DOKUMEN_UPLOAD_BYTES) {
        throw new DokumenUploadError(413, "Ukuran PDF maksimal 10 MB.");
    }

    const namaAsli =
        file.name.replaceAll("\\", "/").split("/").pop()?.trim() ?? "";

    if (
        !namaAsli ||
        namaAsli.length > MAX_NAMA_ASLI_DOKUMEN_LENGTH ||
        !namaAsli.toLowerCase().endsWith(".pdf") ||
        [...namaAsli].some(
            (character) =>
                character.charCodeAt(0) < 32 ||
                character.charCodeAt(0) === 127,
        )
    ) {
        throw new DokumenUploadError(400, "Nama berkas PDF tidak valid.");
    }

    const data = Buffer.from(await file.arrayBuffer());

    if (!data.subarray(0, 5).equals(Buffer.from("%PDF-"))) {
        throw new DokumenUploadError(
            415,
            "Isi berkas harus berformat PDF.",
        );
    }

    try {
        const pdf = await PDFDocument.load(data, {
            ignoreEncryption: false,
            throwOnInvalidObject: true,
            updateMetadata: false,
        });

        if (pdf.getPageCount() < 1) {
            throw new DokumenUploadError(
                400,
                "PDF harus memiliki setidaknya satu halaman.",
            );
        }
    } catch (error) {
        if (error instanceof DokumenUploadError) {
            throw error;
        }

        throw new DokumenUploadError(
            415,
            "PDF tidak dapat dibaca. Gunakan PDF yang tidak rusak dan tidak terenkripsi.",
        );
    }

    return { data, namaAsli };
}
