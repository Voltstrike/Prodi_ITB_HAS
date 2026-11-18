import assert from "node:assert/strict";
import test from "node:test";
import {
    academicDateLabel,
    academicSummary,
    academicToday,
    calendarActivity,
    firstPublishedAt,
    isAcademicDate,
    isAcademicStatus,
    isAcademicYear,
} from "../lib/akademik/policy";

test("tanggal kalender menolak tanggal mustahil dan tipe yang salah", () => {
    for (const value of ["2000-02-29", "2028-02-29", "2026-11-18"]) {
        assert.equal(isAcademicDate(value), true);
    }

    for (const value of [
        "2100-02-29", "2026-02-29", "2026-11-31", "2026-13-01",
        "2026-1-01", "18/11/2026", "2026-11-18T00:00:00Z",
        "1899-12-31", "", null, 2026, [], {},
    ]) assert.equal(isAcademicDate(value), false);
});

test("tahun akademik berurutan dan status publikasi terbatas", () => {
    assert.equal(isAcademicYear("2026/2027"), true);

    for (const value of [
        "2026/2028", "2027/2026", "26/27", "", null, 2026,
    ]) assert.equal(isAcademicYear(value), false);

    assert.equal(isAcademicStatus("DRAFT"), true);
    assert.equal(isAcademicStatus("PUBLISHED"), true);

    for (const value of ["draft", "ACTIVE", true, null]) {
        assert.equal(isAcademicStatus(value), false);
    }
});

test("pergantian tanggal mengikuti tengah malam WIB", () => {
    assert.equal(
        academicToday(new Date("2026-11-17T16:59:59.999Z")),
        "2026-11-17",
    );
    assert.equal(
        academicToday(new Date("2026-11-17T17:00:00Z")),
        "2026-11-18",
    );
});

test("hari terakhir kegiatan tetap berlangsung sampai akhir hari WIB", () => {
    assert.equal(
        calendarActivity("2026-11-16", "2026-11-17", "2026-11-15"),
        "UPCOMING",
    );
    assert.equal(
        calendarActivity("2026-11-16", "2026-11-17", "2026-11-16"),
        "ONGOING",
    );
    assert.equal(
        calendarActivity(
            "2026-11-16", "2026-11-17",
            academicToday(new Date("2026-11-17T16:59:59.999Z")),
        ),
        "ONGOING",
    );
    assert.equal(
        calendarActivity(
            "2026-11-16", "2026-11-17",
            academicToday(new Date("2026-11-17T17:00:00Z")),
        ),
        "FINISHED",
    );
});

test("kegiatan sehari diterima; tanggal lama yang rusak tidak ditebak", () => {
    assert.equal(
        calendarActivity("2026-11-18", "", "2026-11-18"),
        "ONGOING",
    );
    assert.equal(
        calendarActivity("2026-11-18", null, "2026-11-19"),
        "FINISHED",
    );
    assert.equal(
        calendarActivity("2026-11-18", "2026-11-17", "2026-11-18"),
        "UNKNOWN",
    );
    assert.equal(
        calendarActivity("18 November 2026", "", "2026-11-18"),
        "UNKNOWN",
    );
    assert.equal(academicDateLabel("tanggal lama"), "tanggal lama");
    assert.match(academicDateLabel("2026-11-18"), /18 November 2026/);
});

test("tanggal terbit pertama tetap tersimpan setelah edit dan terbit ulang", () => {
    const first = "2026-11-18T03:00:00.000Z";
    const now = new Date("2026-11-20T05:00:00Z");

    assert.equal(firstPublishedAt(null, "DRAFT", now), null);
    assert.equal(firstPublishedAt(null, "PUBLISHED", now), now.toISOString());

    for (const status of ["DRAFT", "PUBLISHED"] as const) {
        assert.equal(firstPublishedAt({
            status: "DRAFT",
            diterbitkanPada: first,
            createdAt: first,
        }, status, now), first);

        assert.equal(firstPublishedAt({
            status: "PUBLISHED",
            diterbitkanPada: null,
            createdAt: first,
        }, status, now), first);
    }

    assert.equal(firstPublishedAt({
        status: "DRAFT",
        diterbitkanPada: null,
        createdAt: first,
    }, "PUBLISHED", now), now.toISOString());
});

test("ringkasan mengambil paragraf pertama dan menjaga batas Unicode", () => {
    assert.equal(
        academicSummary("  Paragraf pertama.\r\n\r\nParagraf kedua. "),
        "Paragraf pertama.",
    );

    const summary = academicSummary("a".repeat(218) + "😀😀😀");
    assert.equal(summary, "a".repeat(218) + "😀…");
    assert.equal(Array.from(summary).length, 220);
});
