import assert from "node:assert/strict";
import { test } from "node:test";
import {
    parsePublicationFilters,
    publicationHref,
} from "../lib/publikasi/filters";

test("filter publik mengabaikan permintaan status tersembunyi", () => {
    const result = parsePublicationFilters(
        new URLSearchParams("status=SEMUA&status=TERSEMBUNYI"),
        "public",
        2027,
    );
    if (!result.ok) throw new Error(result.message);
    assert.equal(result.filters.status, "TAMPIL");

    const admin = parsePublicationFilters(
        new URLSearchParams("status=TERSEMBUNYI"), "admin", 2027,
    );
    if (!admin.ok) throw new Error(admin.message);
    assert.equal(admin.filters.status, "TERSEMBUNYI");
});

test("filter berulang, tahun atau jenis tidak valid, dan halaman tidak aman ditolak", () => {
    for (const query of [
        "q=a&q=b", "jenis=PENGABDIAN", "tahun=2026.5", "tahun=2028",
        "page=0", "page=1e3", "page=9007199254740992", "status=INVALID",
        "q=" + "a".repeat(201),
    ]) {
        assert.equal(
            parsePublicationFilters(
                new URLSearchParams(query), "admin", 2027,
            ).ok,
            false,
        );
    }
});

test("pagination mempertahankan filter dan URL publik tidak membawa status admin", () => {
    const result = parsePublicationFilters(new URLSearchParams({
        q: "Kinerja & Risiko",
        jenis: "TESIS",
        tahun: "2026",
        status: "TERSEMBUNYI",
    }), "admin", 2027);

    if (!result.ok) throw new Error(result.message);

    const admin = new URL(
        publicationHref(result.filters, 3, "admin"),
        "https://example.invalid",
    );
    assert.equal(admin.pathname, "/admin/publikasi");
    assert.equal(admin.searchParams.get("q"), "Kinerja & Risiko");
    assert.equal(admin.searchParams.get("status"), "TERSEMBUNYI");
    assert.equal(admin.searchParams.get("page"), "3");

    const publicUrl = new URL(publicationHref(result.filters, 1), admin);
    assert.equal(publicUrl.pathname, "/publikasi");
    assert.equal(publicUrl.searchParams.has("status"), false);
    assert.equal(publicUrl.searchParams.has("page"), false);
});
