import assert from "node:assert/strict";
import {
    mkdtemp, mkdir, open, rm, symlink, utimes, writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { MAX_IMAGE_UPLOAD_BYTES } from "../lib/media/constants";
import { MAX_DOKUMEN_UPLOAD_BYTES } from "../lib/dokumen/constants";
import {
    listStoredImages,
    readLibraryFileInfo,
} from "../lib/media/library-files";

test("inventaris gambar melewati symlink, direktori, berkas sementara, dan ukuran salah", async () => {
    const temporary = await mkdtemp(
        join(tmpdir(), "itbhas-media-library-"),
    );

    try {
        const directory = join(temporary, "images");
        await mkdir(directory, { mode: 0o700 });

        const first = `${"a".repeat(32)}.webp`;
        const second = `${"b".repeat(32)}.webp`;

        await writeFile(join(directory, first), "metadata-test");
        await writeFile(join(directory, second), "metadata-test");

        const date = new Date("2026-01-01T00:00:00.000Z");
        await utimes(join(directory, first), date, date);
        await utimes(join(directory, second), date, date);

        await writeFile(
            join(temporary, "private.bin"),
            "PRIVATE",
        );

        const linked = `${"c".repeat(32)}.webp`;
        await symlink(
            join(temporary, "private.bin"),
            join(directory, linked),
        );

        await mkdir(
            join(directory, `${"d".repeat(32)}.webp`),
        );
        await writeFile(
            join(directory, `${"e".repeat(32)}.webp`),
            "",
        );
        await writeFile(
            join(directory, ".pending-upload.webp"),
            "pending",
        );
        await writeFile(
            join(directory, "manual.png"),
            "ignored",
        );

        const handle = await open(
            join(directory, `${"f".repeat(32)}.webp`),
            "wx",
        );
        try {
            await handle.truncate(MAX_IMAGE_UPLOAD_BYTES + 1);
        } finally {
            await handle.close();
        }

        const result = await listStoredImages(directory);

        assert.deepEqual(
            result.map((item) => item.filename),
            [first, second],
        );
        assert.equal(result[0].url, `/media/${first}`);
        assert.deepEqual(
            Object.keys(result[0]).sort(),
            ["filename", "modifiedAt", "size", "url"],
        );

        assert.equal(
            await readLibraryFileInfo(directory, linked, "GAMBAR"),
            null,
        );
        assert.equal(
            await readLibraryFileInfo(
                directory, "../private.bin", "GAMBAR",
            ),
            null,
        );
        assert.deepEqual(
            await listStoredImages(join(temporary, "missing")),
            [],
        );
    } finally {
        await rm(temporary, { recursive: true, force: true });
    }
});

test("metadata PDF memvalidasi nama, ukuran, symlink, dan URL publik", async () => {
    const temporary = await mkdtemp(
        join(tmpdir(), "itbhas-document-library-"),
    );

    try {
        const filename = `${"a".repeat(32)}.pdf`;
        await writeFile(
            join(temporary, filename),
            "%PDF-metadata-test",
        );

        const result = await readLibraryFileInfo(
            temporary, filename, "DOKUMEN",
        );

        assert.ok(result);
        assert.equal(
            result.url,
            `/dokumen/unggahan/${filename}`,
        );
        assert.equal(
            await readLibraryFileInfo(
                temporary, filename, "GAMBAR",
            ),
            null,
        );
        assert.equal(
            await readLibraryFileInfo(
                temporary, "../secret.pdf", "DOKUMEN",
            ),
            null,
        );

        const linked = `${"b".repeat(32)}.pdf`;
        await symlink(
            join(temporary, filename),
            join(temporary, linked),
        );
        assert.equal(
            await readLibraryFileInfo(
                temporary, linked, "DOKUMEN",
            ),
            null,
        );

        const oversized = `${"c".repeat(32)}.pdf`;
        const handle = await open(
            join(temporary, oversized),
            "wx",
        );
        try {
            await handle.truncate(MAX_DOKUMEN_UPLOAD_BYTES + 1);
        } finally {
            await handle.close();
        }

        assert.equal(
            await readLibraryFileInfo(
                temporary, oversized, "DOKUMEN",
            ),
            null,
        );
    } finally {
        await rm(temporary, { recursive: true, force: true });
    }
});
