import assert from "node:assert/strict";
import {
    mkdtemp,
    mkdir,
    rm,
    symlink,
    utimes,
    writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
    collectMediaLibraryPage,
    type LibraryDocument,
} from "../lib/media/library-list";

test("pustaka menggabungkan media, memakai pencarian literal, dan membatasi halaman", async () => {
    const root = await mkdtemp(
        join(tmpdir(), "media-page-"),
    );
    const imageDirectory = join(root, "images");
    const documentDirectory = join(root, "documents");

    try {
        await mkdir(imageDirectory);
        await mkdir(documentDirectory);

        const date = new Date("2026-01-01T00:00:00Z");

        for (let i = 0; i < 25; i++) {
            const filename =
                `${i.toString(16).padStart(32, "0")}.webp`;

            await writeFile(
                join(imageDirectory, filename),
                "image-test",
            );
            await utimes(
                join(imageDirectory, filename),
                date,
                date,
            );
        }

        const filename = `${"a".repeat(32)}.pdf`;

        await writeFile(
            join(documentDirectory, filename),
            "%PDF-test",
        );

        const documents: LibraryDocument[] = [{
            filename,
            judul: "Panduan Tesis %_ & Uji",
            namaAsli: "Pedoman Asli.pdf",
            ukuran: 9,
        }];

        const sources = {
            imageDirectory,
            documentDirectory,
            loadDocuments: async () => documents,
        };

        const first = await collectMediaLibraryPage(
            { q: "", jenis: "", page: 1 },
            sources,
        );

        assert.equal(first.total, 26);
        assert.equal(first.items.length, 24);
        assert.equal(first.totalPages, 2);
        assert.equal(first.items[0].jenis, "DOKUMEN");

        const last = await collectMediaLibraryPage(
            {
                q: "",
                jenis: "",
                page: Number.MAX_SAFE_INTEGER,
            },
            sources,
        );

        assert.equal(last.page, 2);
        assert.equal(last.items.length, 2);

        assert.equal(
            new Set(
                [...first.items, ...last.items]
                    .map((item) => item.url),
            ).size,
            26,
        );

        assert.equal(
            last.items[0].filename,
            `${(23).toString(16).padStart(32, "0")}.webp`,
        );

        for (const q of [
            "TESIS",
            "%_ &",
            "Pedoman Asli.pdf",
            filename,
        ]) {
            const match = await collectMediaLibraryPage(
                { q, jenis: "", page: 1 },
                sources,
            );

            assert.equal(match.total, 1);
            assert.equal(
                match.items[0].url,
                `/dokumen/unggahan/${filename}`,
            );
        }

        const literal = await collectMediaLibraryPage(
            { q: "%", jenis: "GAMBAR", page: 1 },
            sources,
        );
        assert.equal(literal.total, 0);

        const pdfOnly = await collectMediaLibraryPage(
            { q: "", jenis: "DOKUMEN", page: 1 },
            sources,
        );
        assert.equal(pdfOnly.total, 1);

        const imageOnly = await collectMediaLibraryPage(
            { q: "", jenis: "GAMBAR", page: 1 },
            {
                ...sources,
                loadDocuments: async () => {
                    throw new Error(
                        "PDF must not be queried",
                    );
                },
            },
        );

        assert.equal(imageOnly.total, 25);
        assert.equal(
            JSON.stringify(first).includes(root),
            false,
        );
    } finally {
        await rm(root, {
            recursive: true,
            force: true,
        });
    }
});

test("PDF tanpa catatan, hilang, ukuran berbeda, dan symlink tidak masuk pustaka", async () => {
    const root = await mkdtemp(
        join(tmpdir(), "media-pdf-page-"),
    );

    try {
        const valid = `${"a".repeat(32)}.pdf`;
        const linked = `${"b".repeat(32)}.pdf`;
        const orphan = `${"c".repeat(32)}.pdf`;

        await writeFile(
            join(root, valid),
            "%PDF-test",
        );
        await writeFile(
            join(root, orphan),
            "%PDF-test",
        );
        await symlink(
            join(root, valid),
            join(root, linked),
        );

        const documents = [
            { filename: valid, ukuran: 8 },
            { filename: linked, ukuran: 9 },
            {
                filename: `${"d".repeat(32)}.pdf`,
                ukuran: 9,
            },
            {
                filename: "../outside.pdf",
                ukuran: 9,
            },
        ].map((item) => ({
            ...item,
            judul: "Uji",
            namaAsli: "Uji.pdf",
        }));

        const result = await collectMediaLibraryPage(
            { q: "", jenis: "DOKUMEN", page: 99 },
            {
                imageDirectory: "/must-not-be-read",
                documentDirectory: root,
                loadDocuments: async () => documents,
            },
        );

        assert.deepEqual(result, {
            items: [],
            total: 0,
            page: 1,
            totalPages: 1,
            pageSize: 24,
        });
    } finally {
        await rm(root, {
            recursive: true,
            force: true,
        });
    }
});
