import {
    DokumenUploadError,
    MAX_DOKUMEN_MULTIPART_BYTES,
    MAX_DOKUMEN_UPLOAD_BYTES,
    MAX_JUDUL_DOKUMEN_LENGTH,
} from "./constants";

export async function readDokumenUpload(
    request: Request,
): Promise<{ judul: string; file: File }> {
    const contentType = request.headers.get("content-type") ?? "";

    if (
        contentType.split(";")[0].trim().toLowerCase() !==
        "multipart/form-data"
    ) {
        throw new DokumenUploadError(
            415,
            "Unggahan harus menggunakan multipart/form-data.",
        );
    }

    const contentLength = Number(request.headers.get("content-length"));

    if (
        Number.isFinite(contentLength) &&
        contentLength > MAX_DOKUMEN_MULTIPART_BYTES
    ) {
        throw new DokumenUploadError(413, "Ukuran PDF maksimal 10 MB.");
    }

    if (!request.body) {
        throw new DokumenUploadError(
            400,
            "Pilih satu PDF dan isi judul dokumen.",
        );
    }

    const reader = request.body.getReader();
    const bytes = new Uint8Array(MAX_DOKUMEN_MULTIPART_BYTES);
    let size = 0;

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const nextSize = size + value.byteLength;

            if (nextSize > MAX_DOKUMEN_MULTIPART_BYTES) {
                await reader.cancel().catch(() => undefined);
                throw new DokumenUploadError(
                    413,
                    "Ukuran PDF maksimal 10 MB.",
                );
            }

            bytes.set(value, size);
            size = nextSize;
        }
    } finally {
        reader.releaseLock();
    }

    let form: FormData;

    try {
        form = await new Response(bytes.subarray(0, size), {
            headers: { "Content-Type": contentType },
        }).formData();
    } catch {
        throw new DokumenUploadError(400, "Data unggahan tidak valid.");
    }

    const files = form.getAll("file");
    const titles = form.getAll("judul");

    if (
        files.length !== 1 ||
        titles.length !== 1 ||
        [...form.keys()].some(
            (key) => key !== "file" && key !== "judul",
        )
    ) {
        throw new DokumenUploadError(
            400,
            "Kirim tepat satu judul dan satu PDF.",
        );
    }

    const title = titles[0];

    if (typeof title !== "string") {
        throw new DokumenUploadError(400, "Judul dokumen tidak valid.");
    }

    const judul = title.trim();

    if (!judul || judul.length > MAX_JUDUL_DOKUMEN_LENGTH) {
        throw new DokumenUploadError(
            400,
            `Judul wajib diisi dan maksimal ${MAX_JUDUL_DOKUMEN_LENGTH} karakter.`,
        );
    }

    const file = files[0];

    if (!file || typeof file === "string" || file.size === 0) {
        throw new DokumenUploadError(
            400,
            "Berkas PDF kosong atau tidak valid.",
        );
    }

    if (file.size > MAX_DOKUMEN_UPLOAD_BYTES) {
        throw new DokumenUploadError(413, "Ukuran PDF maksimal 10 MB.");
    }

    return { judul, file };
}
