import { lstat, readdir } from "node:fs/promises";
import { join } from "node:path";
import {
    MAX_IMAGE_UPLOAD_BYTES,
    isMediaFileName,
} from "./constants";
import {
    MAX_DOKUMEN_UPLOAD_BYTES,
    isDokumenFileName,
} from "../dokumen/constants";
import type { MediaLibraryType } from "./library-filters";

export type LibraryFileInfo = {
    filename: string;
    url: string;
    size: number;
    modifiedAt: string;
};

function missingFile(error: unknown): boolean {
    const code = error && typeof error === "object" &&
        "code" in error ? error.code : null;

    return code === "ENOENT" ||
        code === "ENOTDIR" ||
        code === "ELOOP";
}

export async function readLibraryFileInfo(
    directory: string,
    filename: string,
    kind: MediaLibraryType,
): Promise<LibraryFileInfo | null> {
    if (typeof filename !== "string") return null;

    const valid = kind === "GAMBAR"
        ? isMediaFileName(filename)
        : kind === "DOKUMEN" && isDokumenFileName(filename);

    if (!valid) return null;

    try {
        const info = await lstat(join(directory, filename));
        const limit = kind === "GAMBAR"
            ? MAX_IMAGE_UPLOAD_BYTES
            : MAX_DOKUMEN_UPLOAD_BYTES;

        if (
            !info.isFile() ||
            info.size === 0 ||
            info.size > limit ||
            !Number.isFinite(info.mtime.getTime())
        ) {
            return null;
        }

        return {
            filename,
            url: kind === "GAMBAR"
                ? `/media/${filename}`
                : `/dokumen/unggahan/${filename}`,
            size: info.size,
            modifiedAt: info.mtime.toISOString(),
        };
    } catch (error) {
        if (missingFile(error)) return null;
        throw error;
    }
}

export async function listStoredImages(
    directory: string,
): Promise<LibraryFileInfo[]> {
    const entries = await readdir(directory, {
        withFileTypes: true,
    }).catch((error: unknown) => {
        if (missingFile(error)) return [];
        throw error;
    });

    const candidates = entries.filter(
        (item) => item.isFile() && isMediaFileName(item.name),
    );

    const result: LibraryFileInfo[] = [];
    let next = 0;

    await Promise.all(Array.from({
        length: Math.min(8, candidates.length),
    }, async () => {
        while (next < candidates.length) {
            const entry = candidates[next++];
            const info = await readLibraryFileInfo(
                directory,
                entry.name,
                "GAMBAR",
            );
            if (info) result.push(info);
        }
    }));

    return result.sort((a, b) =>
        Date.parse(b.modifiedAt) - Date.parse(a.modifiedAt) ||
        a.filename.localeCompare(b.filename, "en"),
    );
}
