import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db } from "../prisma/db";
import {
    publicationMaxYear,
    validatePublikasiInput,
} from "../lib/publikasi/validation";
import { parsePublicationFilters } from "../lib/publikasi/filters";
import {
    getPublicationsPage,
    getAdminPublicationsPage,
    getPublicPublicationBySlug,
    getAdminPublicationById,
} from "../lib/publikasi/queries";

const prefix = `uji-publikasi-${randomUUID()}`;
const ids: number[] = [];
const slugs: string[] = [];
let passed = false;
let cleaned = false;

function filters(values: Record<string, string>) {
    const parsed = parsePublicationFilters(
        new URLSearchParams(values),
        "admin",
    );
    if (!parsed.ok) throw new Error(parsed.message);
    return parsed.filters;
}

try {
    const target = new URL(process.env.DATABASE_URL ?? "");

    if (
        !["postgres:", "postgresql:"].includes(target.protocol) ||
        target.hostname !== "localhost" ||
        (target.port || "5432") !== "5432" ||
        target.pathname !== "/mm_itbhas"
    ) {
        throw new Error("Pengujian hanya untuk database lokal mm_itbhas.");
    }

    for (const ditampilkan of [true, false]) {
        const validated = validatePublikasiInput({
            judul: ditampilkan
                ? `${prefix} 100%_\\ ditampilkan`
                : `${prefix} 100ABX tersembunyi`,
            jenis: "TESIS",
            penulis: "Penulis Uji Pertama\nPenulis Uji Kedua",
            tahun: publicationMaxYear() - 1,
            sumber: "Pengujian lokal",
            tautanPublikasi: "https://example.invalid/publikasi",
            ditampilkan,
        });

        if (!validated.ok) throw new Error(validated.message);

        const row = await db.orm.public.PublikasiIlmiah.create({
            ...validated.data,
            slug: `${prefix}-${ditampilkan ? "tampil" : "tersembunyi"}`,
        });
        ids.push(row.id);
        slugs.push(row.slug);
    }

    const requestAll = filters({ q: prefix, status: "SEMUA" });

    const publicPage = await getPublicationsPage(requestAll);
    assert.equal(publicPage.total, 1);
    assert.equal(publicPage.pageSize, 9);
    assert.deepEqual(publicPage.publications.map((row) => row.id), [ids[0]]);
    assert.ok(publicPage.publications.every((row) => row.ditampilkan));

    const adminPage = await getAdminPublicationsPage(requestAll);
    assert.equal(adminPage.total, 2);
    assert.equal(adminPage.pageSize, 25);

    const hidden = await getAdminPublicationsPage(filters({
        q: prefix, status: "TERSEMBUNYI",
    }));
    assert.equal(hidden.total, 1);
    assert.equal(hidden.publications[0].id, ids[1]);

    assert.equal(await getPublicPublicationBySlug(slugs[1]), null);
    assert.equal((await getPublicPublicationBySlug(slugs[0]))?.id, ids[0]);
    assert.equal((await getAdminPublicationById(ids[1]))?.ditampilkan, false);

    const literal = await getPublicationsPage(filters({
        q: `${prefix} 100%_\\`,
    }));
    assert.equal(literal.total, 1);

    const empty = await getPublicationsPage(filters({
        q: `tidak-ada-${randomUUID()}`,
        page: String(Number.MAX_SAFE_INTEGER),
    }));
    assert.equal(empty.total, 0);
    assert.equal(empty.page, 1);
    assert.equal(empty.totalPages, 1);

    console.log("LULUS: pemisahan publik/admin, status, detail tersembunyi, pencarian literal, dan hasil kosong.");
    passed = true;
} catch (error) {
    process.exitCode = 1;
    const message = error instanceof Error ? error.message : "Kesalahan tidak dikenal.";
    console.error(message.replace(
        /postgres(?:ql)?:\/\/[^\s"'<>]+/gi,
        "[URL database disamarkan]",
    ));
} finally {
    try {
        if (ids.length > 0) {
            await db.transaction(async (tx) => {
                for (const id of ids) {
                    const remove = db.raw.sql`
                        DELETE FROM public."publikasiIlmiah"
                        WHERE id = ${id}
                        RETURNING id
                    `.returnsRow({ id: "pg/int4@1" }).build();

                    await tx.query(remove);
                }
            });
        }
        cleaned = true;
    } catch (error) {
        process.exitCode = 1;
        console.error("Pembersihan gagal. ID publikasi uji:", ids);
        console.error(error instanceof Error ? error.name : "UnknownError");
    }

    try {
        await db.close();
    } catch {
        process.exitCode = 1;
        console.error("Koneksi pengujian gagal ditutup.");
    }
}

if (passed && cleaned && process.exitCode !== 1) {
    console.log("Semua uji query publikasi lulus. Data uji telah dihapus.");
}
