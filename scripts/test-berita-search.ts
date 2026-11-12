import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db } from "../prisma/db";
import {
    getPublishedNewsPage,
    type PublishedNewsPage,
} from "../lib/berita/list";
import {
    escapeNewsSearchLike,
    parseNewsListFilters,
} from "../lib/berita/list-filters";

const base = "http://localhost:3000";
const prefix = `news-search-${randomUUID()}`;
const keyword = `${prefix} & uji`;
const literal = `${keyword} %_\\`;
const summaryOnly = `summary-${randomUUID()}`;
const contentOnly = `content-${randomUUID()}`;
const draftOnly = `draft-${randomUUID()}`;
const publicationOnly = `publication-${randomUUID()}`;
const publicationSlug = `${prefix}-publication`;
const xss = '<script>alert("news-search-test")</script>';

function filters(values: Record<string, string> = {}) {
    const parsed = parseNewsListFilters(new URLSearchParams(values));
    if (!parsed.ok) throw new Error(parsed.message);
    return parsed.filters;
}

function rendered(html: string) {
    return html
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<!--[\s\S]*?-->/g, "");
}

function hrefs(html: string) {
    return [...rendered(html).matchAll(/\bhref="([^"]*)"/g)]
        .map((match) => new URL(
            match[1].replaceAll("&amp;", "&"),
            base,
        ));
}

async function readPage(values: Record<string, string> = {}) {
    const url = new URL("/berita", base);
    url.search = new URLSearchParams(values).toString();

    let response: Response;
    try {
        response = await fetch(url, {
            redirect: "manual",
            cache: "no-store",
            signal: AbortSignal.timeout(30000),
        });
    } catch {
        throw new Error(
            "Server development harus berjalan di http://localhost:3000.",
        );
    }

    assert.equal(
        response.status, 200,
        "Halaman berita tidak memberikan HTTP 200.",
    );

    const html = await response.text();
    assert.match(
        html, /id="berita-search"/,
        "Kolom pencarian berita belum tampil.",
    );
    return html;
}

async function main() {
    let target: URL;
    try {
        target = new URL(process.env.DATABASE_URL ?? "");
    } catch {
        throw new Error("DATABASE_URL lokal tidak valid.");
    }

    if (
        !["postgres:", "postgresql:"].includes(target.protocol) ||
        target.hostname !== "localhost" ||
        (target.port || "5432") !== "5432" ||
        target.pathname !== "/mm_itbhas"
    ) {
        throw new Error(
            "Pengujian hanya untuk database lokal mm_itbhas.",
        );
    }

    let attempted = false;
    let passed = false;
    let cleaned = true;
    let original: PublishedNewsPage | null = null;
    let fixtures: {
        published: { id: number; slug: string }[];
        newsIds: number[];
        publicationId: number;
    } | null = null;

    try {
        await readPage();
        original = await getPublishedNewsPage(filters());

        attempted = true;
        fixtures = await db.transaction(async (tx) => {
            const published: { id: number; slug: string }[] = [];
            const common = {
                date: "Uji pencarian",
                description: "Ringkasan pengujian lokal.",
                image: "/brand/logo-itbhas.png",
                thumbnail: null,
                content: "Isi pengujian lokal.",
                createdAt: "2026-01-01T00:00:00.000Z",
            };

            for (let index = 0; index < 20; index++) {
                const row = await tx.orm.public.Berita.create({
                    ...common,
                    title: index === 0
                        ? `${literal} berita literal`
                        : index === 1
                            ? `${keyword} ${xss}`
                            : `${keyword} berita ${index}`,
                    slug: `${prefix}-news-${index}`,
                    description: index === 2
                        ? summaryOnly : common.description,
                    content: index === 3
                        ? contentOnly
                        : index === 4
                            ? `${prefix} kalimat\n   lintas baris`
                            : common.content,
                    status: "PUBLISHED",
                });

                published.push({ id: row.id, slug: row.slug });
            }

            const draft = await tx.orm.public.Berita.create({
                ...common,
                title: `${keyword} ${draftOnly}`,
                slug: `${prefix}-draft-minimal`,
                date: "",
                description: "",
                image: "",
                content: "",
                status: "DRAFT",
            });

            const completeDraft = await tx.orm.public.Berita.create({
                ...common,
                title: `${keyword} draf lengkap`,
                slug: `${prefix}-draft-full`,
                content: draftOnly,
                status: "DRAFT",
            });

            const publication =
                await tx.orm.public.PublikasiIlmiah.create({
                    judul: `${keyword} ${publicationOnly}`,
                    slug: publicationSlug,
                    jenis: "TESIS",
                    penulis: "Penulis Uji",
                    tahun: 2026,
                    sumber: "Sumber Uji",
                    ringkasan: null,
                    doi: null,
                    tautanPublikasi:
                        "https://example.invalid/publication",
                    ditampilkan: true,
                });

            return {
                published,
                newsIds: [
                    ...published.map((row) => row.id),
                    draft.id,
                    completeDraft.id,
                ],
                publicationId: publication.id,
            };
        });

        const first = await getPublishedNewsPage(
            filters({ q: keyword }),
        );
        const second = await getPublishedNewsPage(
            filters({ q: keyword, page: "2" }),
        );
        const third = await getPublishedNewsPage(
            filters({ q: keyword, page: "3" }),
        );
        const last = await getPublishedNewsPage(filters({
            q: keyword,
            page: String(Number.MAX_SAFE_INTEGER),
        }));

        assert.equal(first.total, 20);
        assert.equal(first.totalPages, 3);
        assert.equal(first.pageSize, 9);
        assert.deepEqual(
            [
                first.berita.length,
                second.berita.length,
                third.berita.length,
            ],
            [9, 9, 2],
        );

        const expectedIds = [...fixtures.published]
            .reverse().map((row) => row.id);
        const actualIds = [
            ...first.berita, ...second.berita, ...third.berita,
        ].map((row) => row.id);

        assert.deepEqual(actualIds, expectedIds);
        assert.equal(new Set(actualIds).size, 20);
        assert.equal(last.page, 3);
        assert.deepEqual(last.berita, third.berita);
        assert.equal(
            (await getPublishedNewsPage(filters())).total,
            original.total + 20,
        );

        console.log(
            "LULUS: sembilan berita per halaman, urutan waktu sama, dan halaman terakhir.",
        );

        for (const q of [
            literal, summaryOnly, contentOnly,
            `${prefix} kalimat lintas baris`,
        ]) {
            assert.equal(
                (await getPublishedNewsPage(filters({ q }))).total,
                1,
            );
        }

        assert.equal(
            (await getPublishedNewsPage(
                filters({ q: keyword.toUpperCase() }),
            )).total,
            20,
        );

        for (const q of [
            draftOnly, publicationOnly, `${prefix}' OR 1=1 --`,
        ]) {
            const result = await getPublishedNewsPage(filters({ q }));
            assert.equal(result.total, 0);
            assert.deepEqual(result.berita, []);
        }

        const override = await getPublishedNewsPage(filters({
            q: keyword,
            status: "DRAFT",
            jenis: "PUBLIKASI",
            scope: "admin",
        }));
        assert.equal(override.total, 20);

        assert.deepEqual(Object.keys(first.berita[0]).sort(), [
            "date", "description", "id", "image",
            "slug", "thumbnail", "title",
        ]);

        console.log(
            "LULUS: judul, ringkasan, isi, pencarian literal, dan pemisahan draf/publikasi.",
        );

        const html = await readPage({ q: keyword });
        assert.match(
            rendered(html), /\b20\s+hasil\b/,
            "Jumlah hasil HTTP tidak sesuai.",
        );
        assert.equal(html.includes(`${prefix}-draft-minimal`), false);
        assert.equal(html.includes(`${prefix}-draft-full`), false);
        assert.equal(html.includes("navbar-search-query"), false);

        const firstLinks = hrefs(html);
        assert.deepEqual(
            firstLinks.filter((url) =>
                url.pathname.startsWith(`/berita/${prefix}-news-`),
            ).map((url) => url.pathname),
            [...fixtures.published].reverse().slice(0, 9)
                .map((row) => `/berita/${row.slug}`),
        );

        assert.ok(firstLinks.some((url) =>
            url.pathname === "/berita" &&
            url.searchParams.get("q") === keyword &&
            url.searchParams.get("page") === "2",
        ));

        const secondHtml = await readPage({
            q: keyword, page: "2",
        });
        assert.ok(hrefs(secondHtml).some((url) =>
            url.pathname === "/berita" &&
            url.searchParams.get("q") === keyword &&
            !url.searchParams.has("page"),
        ));

        const thirdHtml = await readPage({
            q: keyword, page: "3",
        });
        assert.equal(
            thirdHtml.includes(xss), false,
            "Judul HTML tidak boleh menjadi script.",
        );
        assert.ok(
            thirdHtml.includes("&lt;script&gt;"),
            "Judul HTML harus tampil sebagai teks.",
        );

        for (const q of [draftOnly, publicationOnly]) {
            assert.match(
                rendered(await readPage({ q })),
                /\b0\s+hasil\b/,
                "Konten tersembunyi atau jenis lain masuk hasil HTTP.",
            );
        }

        assert.match(
            rendered(await readPage({
                q: keyword, page: "1e3",
            })),
            /Nomor halaman tidak valid/,
            "Halaman tidak valid harus ditolak.",
        );

        console.log(
            "LULUS: HTTP, tautan pagination, escape HTML, dan pencarian khusus berita.",
        );

        await db.orm.public.Berita
            .where({ id: fixtures.published[19].id })
            .update({ status: "DRAFT" });

        assert.equal(
            (await getPublishedNewsPage(
                filters({ q: keyword }),
            )).total,
            19,
        );
        assert.match(
            rendered(await readPage({ q: keyword })),
            /\b19\s+hasil\b/,
            "Berita yang dikembalikan ke draf masih terhitung.",
        );

        for (const path of ["/pencarian", "/api/pencarian"]) {
            const response = await fetch(new URL(path, base), {
                redirect: "manual",
                signal: AbortSignal.timeout(30000),
            });
            assert.equal(
                response.status, 404,
                "Route pencarian terpadu masih tersedia.",
            );
            await response.arrayBuffer();
        }

        console.log(
            "LULUS: perubahan ke draf langsung berlaku dan route pencarian terpadu sudah dilepas.",
        );
        passed = true;
    } finally {
        try {
            if (attempted) {
                const deleted = await db.transaction(async (tx) => {
                    const news = await tx.query(db.raw.sql`
                        DELETE FROM public."berita"
                        WHERE slug LIKE ${`${escapeNewsSearchLike(prefix)}-%`}::text
                            ESCAPE chr(92)
                        RETURNING id
                    `.returnsRow({ id: "pg/int4@1" }).build());

                    const publications = await tx.query(db.raw.sql`
                        DELETE FROM public."publikasiIlmiah"
                        WHERE slug = ${publicationSlug}
                        RETURNING id
                    `.returnsRow({ id: "pg/int4@1" }).build());

                    return { news, publications };
                });

                if (fixtures) {
                    assert.deepEqual(
                        deleted.news.map((row) => row.id)
                            .sort((a, b) => a - b),
                        [...fixtures.newsIds].sort((a, b) => a - b),
                    );
                    assert.deepEqual(
                        deleted.publications.map((row) => row.id),
                        [fixtures.publicationId],
                    );
                }

                assert.equal(
                    (await getPublishedNewsPage(
                        filters({ q: keyword }),
                    )).total,
                    0,
                );

                if (original) {
                    assert.deepEqual(
                        await getPublishedNewsPage(filters()),
                        original,
                    );
                }
            }
        } catch (error) {
            cleaned = false;
            process.exitCode = 1;
            console.error(
                "Pembersihan atau verifikasi akhir gagal. Prefix uji:",
                prefix,
            );
            console.error(
                error instanceof Error ? error.name : "UnknownError",
            );
        }

        try {
            await db.close();
        } catch {
            cleaned = false;
            process.exitCode = 1;
            console.error("Koneksi database pengujian gagal ditutup.");
        }

        if (passed && cleaned) {
            console.log(
                "Semua uji pencarian berita lulus. Data uji telah dihapus dan daftar semula tetap utuh.",
            );
        }
    }
}

main().catch((error: unknown) => {
    process.exitCode = 1;
    console.error(
        "Uji pencarian berita gagal:",
        error instanceof Error ? error.name : "UnknownError",
    );
    if (
        error instanceof Error &&
        ["Error", "AssertionError"].includes(error.name)
    ) {
        console.error(error.message);
    }
});
