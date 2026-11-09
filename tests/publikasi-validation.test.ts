import assert from "node:assert/strict";
import { test } from "node:test";
import {
    normalizePublicationDoi,
    publicationAuthors,
    publicationDoiUrl,
    publicationMaxYear,
    validatePublikasiInput,
} from "../lib/publikasi/validation";

const valid = {
    judul: "  Analisis   Kinerja Keuangan  ",
    jenis: "ARTIKEL",
    penulis: " Rina, S.E., M.M.\r\n\r\n Budi Santoso ",
    tahun: "2026",
    sumber: " Jurnal Manajemen ",
    tautanPublikasi: "https://example.org/artikel/1",
};

test("nama dengan gelar tetap utuh dan urutan penulis dipertahankan", () => {
    const result = validatePublikasiInput(valid, 2027);
    if (!result.ok) throw new Error(result.message);

    assert.equal(result.data.judul, "Analisis Kinerja Keuangan");
    assert.deepEqual(publicationAuthors(result.data.penulis), [
        "Rina, S.E., M.M.",
        "Budi Santoso",
    ]);
    assert.equal(result.data.tahun, 2026);
});

test("entri awal tersembunyi dan tesis boleh tanpa DOI maupun ringkasan", () => {
    const result = validatePublikasiInput({
        ...valid, jenis: "TESIS", doi: null, ringkasan: "",
    }, 2027);

    if (!result.ok) throw new Error(result.message);
    assert.equal(result.data.ditampilkan, false);
    assert.equal(result.data.doi, null);
    assert.equal(result.data.ringkasan, null);

    const shown = validatePublikasiInput({
        ...valid, ditampilkan: true,
    }, 2027);

    if (!shown.ok) throw new Error(shown.message);
    assert.equal(shown.data.ditampilkan, true);
});

test("field tambahan, tipe teks salah, dan boolean berbentuk string ditolak", () => {
    for (const patch of [
        { slug: "diatur-client" }, { id: 1 }, { role: "SUPER_ADMIN" },
        { judul: {} }, { penulis: ["Rina"] }, { sumber: 1 },
        { ditampilkan: "false" }, { ditampilkan: null },
    ]) {
        assert.equal(validatePublikasiInput({
            ...valid, ...patch,
        }, 2027).ok, false);
    }
});

test("kelengkapan, jumlah penulis, dan batas panjang ditegakkan", () => {
    for (const field of ["judul", "jenis", "penulis", "sumber", "tautanPublikasi"]) {
        assert.equal(validatePublikasiInput({
            ...valid, [field]: "",
        }, 2027).ok, false);
    }

    for (const patch of [
        { judul: "a".repeat(301) },
        { sumber: "a".repeat(301) },
        { ringkasan: "a".repeat(10001) },
        { penulis: "a".repeat(201) },
        {
            penulis: Array.from(
                { length: 21 }, (_, i) => `Penulis ${i}`,
            ).join("\n"),
        },
    ]) {
        assert.equal(validatePublikasiInput({
            ...valid, ...patch,
        }, 2027).ok, false);
    }
});

test("tahun pecahan, boolean, format eksponen, dan tahun di luar rentang ditolak", () => {
    for (const tahun of [1899, 2028, 2026.5, true, "2e3", "02026", null]) {
        assert.equal(validatePublikasiInput({
            ...valid, tahun,
        }, 2027).ok, false);
    }
});

test("batas tahun memakai pergantian tahun WIB", () => {
    assert.equal(publicationMaxYear(new Date("2026-12-31T16:59:59Z")), 2027);
    assert.equal(publicationMaxYear(new Date("2026-12-31T17:00:00Z")), 2028);
});

test("tautan dengan protokol berbahaya, kredensial, dan kontrol ditolak", () => {
    for (const tautanPublikasi of [
        "javascript:alert(1)",
        "data:text/html,test",
        "ftp://example.org/a",
        "https://user:password@example.org/a",
        "/artikel/1",
        "https://exam\nple.org/a",
        "https://example.org/" + "a".repeat(2048),
    ]) {
        assert.equal(validatePublikasiInput({
            ...valid, tautanPublikasi,
        }, 2027).ok, false);
    }
});

test("DOI mentah, awalan doi, dan URL resolver dinormalisasi", () => {
    for (const input of [
        "10.1000/ABC",
        "doi:10.1000/ABC",
        "https://doi.org/10.1000/ABC",
        "http://dx.doi.org/10.1000/ABC",
    ]) {
        assert.equal(normalizePublicationDoi(input), "10.1000/abc");
    }

    assert.equal(
        normalizePublicationDoi("10.500.100/ABC(1);X"),
        "10.500.100/abc(1);x",
    );
});

test("DOI hanya melipat huruf ASCII dan menjaga karakter Unicode lain", () => {
    assert.equal(normalizePublicationDoi("10.1000/ÄBC"), "10.1000/Äbc");

    assert.notEqual(
        normalizePublicationDoi("10.1000/ÄBC"),
        normalizePublicationDoi("10.1000/äbc"),
    );
});

test("DOI URL ambigu, host palsu, dan DOI tidak valid ditolak", () => {
    for (const input of [
        "https://doi.org.evil.test/10.1000/abc",
        "https://user@doi.org/10.1000/abc",
        "https://doi.org/10.1000/abc?x=1",
        "https://doi.org/10.1000/abc#part",
        "https://doi.org/10.1000/%ZZ",
        "10.1000/",
        "10.1000/a b",
        "javascript:10.1000/abc",
        "10.1000/a\u0000",
        "10.1000/\ud800",
        "10.1000/" + "a".repeat(1025),
        "10.1000/" + "Ä".repeat(512),
    ]) {
        assert.equal(normalizePublicationDoi(input), null);
    }
});

test("tautan DOI mengodekan tanda khusus sebagai bagian identifier", () => {
    assert.equal(
        normalizePublicationDoi("https://doi.org/10.1000/ABC%23Bagian"),
        "10.1000/abc#bagian",
    );

    assert.equal(
        publicationDoiUrl("10.1000/ABC#Bagian?x=1"),
        "https://doi.org/10.1000/abc%23bagian%3Fx%3D1",
    );

    assert.equal(publicationDoiUrl(null), null);
});
