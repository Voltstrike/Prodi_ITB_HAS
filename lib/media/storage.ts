import { randomBytes } from "node:crypto";
import { constants } from "node:fs";
import { link, mkdir, open, rm } from "node:fs/promises";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { MAX_IMAGE_UPLOAD_BYTES, isMediaFileName } from "@/lib/media/constants";

export function mediaDirectory(): string {
    const configured = process.env.MEDIA_UPLOAD_DIR?.trim();

    if (configured && !isAbsolute(configured)) {
        throw new Error("MEDIA_UPLOAD_DIR must be absolute");
    }

    const directory = configured ||
        resolve(process.cwd(), "..", "mm_itbhas_media");
    const inside = relative(process.cwd(), directory);

    if (inside === "" ||
        (!isAbsolute(inside) && inside !== ".." &&
            !inside.startsWith(`..${sep}`))) {
        throw new Error("Media storage must be outside the project directory");
    }

    return directory;
}

export async function saveMedia(data: Buffer): Promise<string> {
    const directory = mediaDirectory();
    await mkdir(directory, { recursive: true, mode: 0o700 });

    const filename = `${randomBytes(16).toString("hex")}.webp`;
    const temporary = join(directory, `.pending-${filename}`);
    const handle = await open(temporary, "wx", 0o600);

    try {
        await handle.writeFile(data);
        await handle.close();
        await link(temporary, join(directory, filename));
    } finally {
        await handle.close().catch(() => undefined);
        await rm(temporary, { force: true });
    }

    return filename;
}

export async function readMedia(filename: string, headersOnly = false) {
    if (!isMediaFileName(filename)) return null;

    try {
        const filePath = join(
            /* turbopackIgnore: true */ mediaDirectory(),
            filename,
        );
        const handle = await open(
            /* turbopackIgnore: true */ filePath,
            constants.O_RDONLY | constants.O_NOFOLLOW,
        );

        try {
            const info = await handle.stat();
            if (!info.isFile() || info.size === 0 ||
                info.size > MAX_IMAGE_UPLOAD_BYTES) {
                return null;
            }

            return {
                size: info.size,
                data: headersOnly ? null : await handle.readFile(),
            };
        } finally {
            await handle.close();
        }
    } catch (error) {
        const code = error && typeof error === "object" &&
            "code" in error ? error.code : null;

        if (code === "ENOENT" || code === "ENOTDIR" || code === "ELOOP") {
            return null;
        }
        throw error;
    }
}
