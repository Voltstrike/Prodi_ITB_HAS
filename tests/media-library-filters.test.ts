import assert from "node:assert/strict";
import test from "node:test";
import {
    mediaLibraryApiHref,
    mediaLibraryHref,
    parseMediaLibraryFilters,
} from "../lib/media/library-filters";

test("filter media memiliki default dan menormalkan spasi", () => {
    assert.deepEqual(
        parseMediaLibraryFilters(new URLSearchParams()),
        { ok: true, filters: { q: "", jenis: "", page: 1 } },
    );

    assert.deepEqual(
        parseMediaLibraryFilters(new URLSearchParams({
            q: "  panduan   tesis ",
            jenis: "DOKUMEN",
            page: "2",
        })),
        {
            ok: true,
            filters: { q: "panduan tesis", jenis: "DOKUMEN", page: 2 },
        },
    );
});

test("jenis, panjang, kontrol, dan parameter berulang ditolak", () => {
    for (const query of [
        "jenis=VIDEO",
        "jenis=GAMBAR&jenis=DOKUMEN",
        "page=1&page=2",
        "q=a&q=b",
    ]) {
        assert.equal(
            parseMediaLibraryFilters(new URLSearchParams(query)).ok,
            false,
        );
    }

    for (const q of [
        "a".repeat(161), "a\0b", "a\nb", "a\tb",
    ]) {
        assert.equal(
            parseMediaLibraryFilters(new URLSearchParams({ q })).ok,
            false,
        );
    }

    assert.equal(
        parseMediaLibraryFilters(
            new URLSearchParams({ q: "a" }),
        ).ok,
        true,
    );
});

test("pagination menolak angka tidak valid dan menerima batas aman", () => {
    for (const page of [
        "", "0", "-1", "01", "1.5", "1e2", "9007199254740992",
    ]) {
        assert.equal(
            parseMediaLibraryFilters(
                new URLSearchParams({ page }),
            ).ok,
            false,
        );
    }

    assert.equal(
        parseMediaLibraryFilters(new URLSearchParams({
            page: String(Number.MAX_SAFE_INTEGER),
        })).ok,
        true,
    );
});

test("path penyimpanan dari parameter tidak menjadi bagian filter", () => {
    assert.deepEqual(
        parseMediaLibraryFilters(new URLSearchParams({
            directory: "/etc",
            path: "../secret",
            q: "foto",
        })),
        { ok: true, filters: { q: "foto", jenis: "", page: 1 } },
    );
});

test("tautan admin dan API menjaga filter serta karakter khusus", () => {
    const filters = {
        q: "foto & page=99 #uji",
        jenis: "GAMBAR" as const,
        page: 2,
    };

    for (const [href, pathname] of [
        [mediaLibraryHref(filters, 3), "/admin/pustaka-media"],
        [mediaLibraryApiHref(filters, 3), "/api/admin/pustaka-media"],
    ]) {
        const url = new URL(href, "https://example.invalid");
        assert.equal(url.pathname, pathname);
        assert.equal(url.hash, "");
        assert.equal(url.searchParams.get("q"), filters.q);
        assert.deepEqual(url.searchParams.getAll("page"), ["3"]);
        assert.equal(url.searchParams.get("jenis"), "GAMBAR");
    }

    const first = new URL(
        mediaLibraryHref(filters, 1),
        "https://example.invalid",
    );
    assert.equal(first.searchParams.has("page"), false);
    assert.throws(() => mediaLibraryHref(filters, 0), RangeError);
});
