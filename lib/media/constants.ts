export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;
export const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export function isMediaFileName(value: unknown): value is string {
    return typeof value === "string" && value.length === 37 &&
        /^[a-f0-9]{32}\.webp$/.test(value);
}

export class ImageUploadError extends Error {
    readonly status: number;

    constructor(status: number, message: string) {
        super(message);
        this.name = "ImageUploadError";
        this.status = status;
    }
}
