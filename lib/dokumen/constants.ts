export const MAX_DOKUMEN_UPLOAD_BYTES = 10 * 1024 * 1024;

export const MAX_DOKUMEN_MULTIPART_BYTES =
    MAX_DOKUMEN_UPLOAD_BYTES + 64 * 1024;

export const MAX_JUDUL_DOKUMEN_LENGTH = 200;
export const MAX_NAMA_ASLI_DOKUMEN_LENGTH = 255;

export const DOKUMEN_MIME_TYPE = "application/pdf";

export function isDokumenFileName(filename: string): boolean {
    return (
        filename.length === 36 &&
        /^[a-f0-9]{32}\.pdf$/.test(filename)
    );
}

export class DokumenUploadError extends Error {
    readonly status: number;

    constructor(status: number, message: string) {
        super(message);
        this.name = "DokumenUploadError";
        this.status = status;
    }
}
