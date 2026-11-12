import assert from "node:assert/strict";
import test from "node:test";
import {
    NEWS_MAX_QUERY_LENGTH,
    escapeNewsSearchLike,
    newsPageHref,
    parseNewsListFilters,
} from "../lib/berita/list-filters";

test("daftar biasa dan pencarian menormalkan kata kunci", () => {
    assert.deepEqual(parseNewsListFilters(new URLSearchParams()), {
        ok: true, filters: { q: "", page: 1 },
    });
    assert.deepEqual(parseNewsListFilters(new URLSearchParams({
        q: "  seminar   nasional  ", page: "2",
    })), {
        ok: true, filters: { q: "seminar nasional", page: 2 },
    });
});

test("kata pendek, terlalu panjang, dan kontrol ditolak", () => {
    for (const q of [
        "a", "😀", "a".repeat(NEWS_MAX_QUERY_LENGTH + 1),
        "berita\nbaru", "berita\tbaru", "berita\0baru",
        "berita\u007fbaru",
    ]) {
        assert.equal(
            parseNewsListFilters(new URLSearchParams({ q })).ok,
            false,
        );
    }
    for (const q of [
        "中文", "a".repeat(NEWS_MAX_QUERY_LENGTH),
    ]) {
        assert.equal(
            parseNewsListFilters(new URLSearchParams({ q })).ok,
            true,
        );
    }
});

test("parameter q dan page berulang ditolak", () => {
    for (const query of [
        "q=&q=tesis", "q=berita&q=seminar", "page=1&page=2",
    ]) {
        assert.equal(
            parseNewsListFilters(new URLSearchParams(query)).ok,
            false,
        );
    }
});

test("pagination menolak angka tidak valid dan menerima batas aman", () => {
    for (const page of [
        "", "0", "-1", "01", "+1", "1.5", "1e3", " 2 ",
        "Infinity", "9007199254740992", "9".repeat(100),
    ]) {
        assert.equal(
            parseNewsListFilters(new URLSearchParams({ page })).ok,
            false,
        );
    }
    const result = parseNewsListFilters(new URLSearchParams({
        page: String(Number.MAX_SAFE_INTEGER),
    }));
    assert.equal(result.ok, true);
    if (result.ok) {
        assert.equal(result.filters.page, Number.MAX_SAFE_INTEGER);
    }
});

test("parameter lain tidak menambah status atau jenis konten", () => {
    assert.deepEqual(parseNewsListFilters(new URLSearchParams({
        q: "seminar", status: "DRAFT",
        jenis: "PUBLIKASI", scope: "admin",
    })), {
        ok: true, filters: { q: "seminar", page: 1 },
    });
});

test("tautan pagination mempertahankan kata kunci dan karakter khusus", () => {
    const q = "seminar & page=999 #keuangan/ITB";
    const url = new URL(
        newsPageHref({ q, page: 1 }, 2),
        "https://example.invalid",
    );

    assert.equal(url.origin, "https://example.invalid");
    assert.equal(url.pathname, "/berita");
    assert.equal(url.hash, "");
    assert.equal(url.searchParams.get("q"), q);
    assert.deepEqual(url.searchParams.getAll("page"), ["2"]);

    const first = new URL(
        newsPageHref({ q, page: 2 }, 1),
        url,
    );
    assert.equal(first.searchParams.has("page"), false);
    assert.equal(newsPageHref({ q: "", page: 1 }), "/berita");

    assert.throws(
        () => newsPageHref({ q, page: 1 }, 0),
        RangeError,
    );
});

test("wildcard persen, underscore, dan backslash tetap literal", () => {
    assert.equal(
        escapeNewsSearchLike("100%_\\uji"),
        "100\\%\\_\\\\uji",
    );
    assert.equal(
        escapeNewsSearchLike("seminar nasional"),
        "seminar nasional",
    );
});
