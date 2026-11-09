import assert from "node:assert/strict";
import { test } from "node:test";
import {
    auditLogDateTime,
    auditLogHref,
    escapeAuditLike,
    parseAuditLogFilters,
} from "../lib/admin/audit-log-filters";

test("tanggal WIB mencakup tepat satu hari dengan batas akhir eksklusif", () => {
    const result = parseAuditLogFilters(new URLSearchParams({
        from: "2026-11-09",
        to: "2026-11-09",
    }));

    if (!result.ok) throw new Error(result.message);
    assert.equal(result.filters.fromInstant, "2026-11-08T17:00:00.000Z");
    assert.equal(result.filters.toExclusiveInstant, "2026-11-09T17:00:00.000Z");
});

test("batas tanggal WIB benar saat berganti tahun dan tahun kabisat", () => {
    for (const [to, expected] of [
        ["2026-12-31", "2026-12-31T17:00:00.000Z"],
        ["2024-02-29", "2024-02-29T17:00:00.000Z"],
    ]) {
        const result = parseAuditLogFilters(new URLSearchParams({ to }));
        if (!result.ok) throw new Error(result.message);
        assert.equal(result.filters.toExclusiveInstant, expected);
    }
});

test("tanggal mustahil dan rentang terbalik ditolak", () => {
    for (const from of [
        "2026-02-29", "2100-02-29", "2026-04-31",
        "2026-13-01", "09/11/2026", "0000-01-01",
    ]) {
        assert.equal(
            parseAuditLogFilters(new URLSearchParams({ from })).ok,
            false,
        );
    }

    assert.equal(parseAuditLogFilters(new URLSearchParams({
        from: "2026-11-10",
        to: "2026-11-09",
    })).ok, false);

    assert.equal(
        parseAuditLogFilters(new URLSearchParams({ from: "2000-02-29" })).ok,
        true,
    );
});

test("pagination menolak angka negatif, pecahan, eksponen, dan angka tidak aman", () => {
    for (const page of [
        "", "0", "-1", "1.5", "1e3", "Infinity", "NaN", "9007199254740992",
    ]) {
        assert.equal(
            parseAuditLogFilters(new URLSearchParams({ page })).ok,
            false,
        );
    }
});

test("parameter ganda dan filter dengan format atau ukuran tidak valid ditolak", () => {
    assert.equal(
        parseAuditLogFilters(new URLSearchParams("action=CREATE&action=DELETE")).ok,
        false,
    );

    for (const [key, value] of [
        ["q", "a".repeat(201)],
        ["actor", "a".repeat(101)],
        ["q", "nama\u0000akun"],
        ["action", "CREATE OR 1=1"],
        ["entity", "Berita;DROP"],
    ]) {
        assert.equal(
            parseAuditLogFilters(new URLSearchParams({ [key]: value })).ok,
            false,
        );
    }
});

test("tautan pagination mempertahankan filter dan mengodekan karakter khusus", () => {
    const result = parseAuditLogFilters(new URLSearchParams({
        q: "  A&B + 100%_  ",
        actor: "Admin Prodi",
        action: "UPDATE",
        entity: "AdminMfa",
        from: "2026-11-01",
        to: "2026-11-09",
    }));

    if (!result.ok) throw new Error(result.message);

    const url = new URL(
        auditLogHref(result.filters, 3),
        "https://example.invalid",
    );
    const parsed = parseAuditLogFilters(url.searchParams);

    if (!parsed.ok) throw new Error(parsed.message);

    assert.deepEqual(parsed.filters, { ...result.filters, page: 3 });
    assert.equal(
        new URL(auditLogHref(result.filters, 1), url).searchParams.has("page"),
        false,
    );
});

test("wildcard pencarian diperlakukan sebagai karakter literal", () => {
    assert.equal(escapeAuditLike("100%_\\contoh"), "100\\%\\_\\\\contoh");
    assert.equal(escapeAuditLike("' OR 1=1 --"), "' OR 1=1 --");
});

test("waktu tampilan memakai WIB meskipun zona waktu server berbeda", () => {
    assert.match(
        auditLogDateTime("2026-11-08T17:00:00.000Z"),
        /9 Nov 2026.*00\.00\.00 WIB/,
    );
    assert.equal(auditLogDateTime("invalid"), "Waktu tidak tersedia");
});
