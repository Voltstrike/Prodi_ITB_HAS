import { randomBytes } from "node:crypto";
import { constants } from "node:fs";
import { link, mkdir, open, rm } from "node:fs/promises";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import {
    MAX_DOKUMEN_UPLOAD_BYTES,
    isDokumenFileName,
} from "./constants";

export function dokumenDirectory(): string {
    const configured = process.env.DOKUMEN_UPLOAD_DIR?.trim();

    if (configured && !isAbsolute(configured)) {
        throw new Error(
            "DOKUMEN_UPLOAD_DIR harus berupa path absolut.",
        );
    }

    const directory = configured
        ? resolve(configured)
        : resolve(process.cwd(), "..", "mm_itbhas_dokumen");

    const inside = relative(process.cwd(), directory);

    if (
        inside === "" ||
        (!isAbsolute(inside) &&
            inside !== ".." &&
            !inside.startsWith(`..${sep}`))
    ) {
        throw new Error(
            "Folder dokumen harus berada di luar folder proyek.",
        );
    }

    return directory;
}

export async function saveDokumen(data: Buffer): Promise<string> {
    if (
        data.length === 0 ||
        data.length > MAX_DOKUMEN_UPLOAD_BYTES
    ) {
        throw new Error("Ukuran data dokumen tidak valid.");
    }

    const directory = dokumenDirectory();

    await mkdir(directory, {
        recursive: true,
        mode: 0o700,
    });

    const filename = `${randomBytes(16).toString("hex")}.pdf`;
    const temporary = join(directory, `.pending-${filename}`);
    const handle = await open(temporary, "wx", 0o600);

    try {
        await handle.writeFile(data);
        await handle.sync();
        await handle.close();
        await link(temporary, join(directory, filename));
    } finally {
        await handle.close().catch(() => undefined);
        await rm(temporary, { force: true });
    }

    return filename;
}

export async function readDokumen(
    filename: string,
    headersOnly = false,
) {
    if (!isDokumenFileName(filename)) return null;

    try {
        const filePath = join(
            /* turbopackIgnore: true */ dokumenDirectory(),
            filename,
        );

        const handle = await open(
            /* turbopackIgnore: true */ filePath,
            constants.O_RDONLY |
                constants.O_NOFOLLOW |
                constants.O_NONBLOCK,
        );

        try {
            const info = await handle.stat();

            if (
                !info.isFile() ||
                info.size === 0 ||
                info.size > MAX_DOKUMEN_UPLOAD_BYTES
            ) {
                return null;
            }

            const data = headersOnly
                ? null
                : await handle.readFile();

            if (data !== null && data.length !== info.size) {
                return null;
            }

            return {
                size: info.size,
                data,
            };
        } finally {
            await handle.close();
        }
    } catch (error) {
        const code =
            error && typeof error === "object" && "code" in error
                ? error.code
                : null;

        if (
            code === "ENOENT" ||
            code === "ENOTDIR" ||
            code === "ELOOP"
        ) {
            return null;
        }

        throw error;
    }
}
