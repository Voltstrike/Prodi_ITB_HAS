import { ImageUploadError, MAX_IMAGE_UPLOAD_BYTES } from "@/lib/media/constants";

const MAX_MULTIPART_BYTES = MAX_IMAGE_UPLOAD_BYTES + 64 * 1024;

export async function readImageUpload(request: Request): Promise<File> {
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.split(";")[0].trim().toLowerCase() !== "multipart/form-data") {
        throw new ImageUploadError(415, "Unggahan harus menggunakan multipart/form-data.");
    }

    const contentLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_MULTIPART_BYTES) {
        throw new ImageUploadError(413, "Ukuran foto maksimal 5 MB.");
    }
    if (!request.body) {
        throw new ImageUploadError(400, "Pilih satu foto untuk diunggah.");
    }

    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            size += value.byteLength;
            if (size > MAX_MULTIPART_BYTES) {
                await reader.cancel().catch(() => undefined);
                throw new ImageUploadError(413, "Ukuran foto maksimal 5 MB.");
            }
            chunks.push(value);
        }
    } finally {
        reader.releaseLock();
    }

    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
    }

    let form: FormData;
    try {
        form = await new Response(bytes, {
            headers: { "Content-Type": contentType },
        }).formData();
    } catch {
        throw new ImageUploadError(400, "Data unggahan tidak valid.");
    }

    const files = form.getAll("file");
    if (files.length !== 1 || [...form.keys()].some((key) => key !== "file")) {
        throw new ImageUploadError(400, "Unggah tepat satu foto pada field file.");
    }

    const file = files[0];
    if (!file || typeof file === "string" || file.size === 0) {
        throw new ImageUploadError(400, "Berkas foto kosong atau tidak valid.");
    }
    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
        throw new ImageUploadError(413, "Ukuran foto maksimal 5 MB.");
    }

    return file;
}
