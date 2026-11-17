import assert from "node:assert/strict";
import { test } from "node:test";
import {
    institutionalLabel, profileAccreditation, profileDocumentUrl,
    profileHistory, profileMission, purposeText,
} from "../lib/profil/presentation";

test("timeline mengikuti narasi dan tidak menjadikan tahun kedaluwarsa sebagai tonggak baru", () => {
    const source = [
        "SEJARAH PROGRAM STUDI\nInstitut Teknologi dan Bisnis",
        "Program studi merupakan bagian dari perjalanan institusi.",
        "Pada 1984, berdirinya Yayasan Indonesia Raya menandai awal perjalanan. Setahun kemudian, pada 1985, STIE mulai menyelenggarakan pendidikan tinggi.",
        "Pada 2010, program studi memperoleh izin operasional berdasarkan SK 176/D/O/2010.",
        "Pada 2013, program studi memperoleh akreditasi BAN-PT.",
        "Pada 2018, program studi memperoleh akreditasi B dengan masa berlaku hingga 2 Oktober 2028.",
        "Perjalanan memasuki babak baru pada 2021. Berdasarkan SK 162/E/O/2021, institusi bertransformasi menjadi ITB HAS.",
        "Upaya tersebut membuahkan hasil pada 2023. Program studi memperoleh akreditasi Baik Sekali dari LAMEMBA berdasarkan SK 726/DE/A.5/AR.10/IX/2023.",
        "Dari perjalanan sejak 1984, 1985, hingga 2010, institusi terus berkembang.",
    ].join("\n\n");
    const result = profileHistory(source);
    assert.deepEqual(result.events.map((item) => item.year), [1984, 1985, 2010, 2013, 2018, 2021, 2023]);
    assert.equal(result.events.find((item) => item.year === 2021)?.title, "Transformasi kelembagaan");
    assert.equal(result.events.at(-1)?.title, "Akreditasi Baik Sekali");
    assert.ok(result.paragraphs.join("\n\n").includes("2 Oktober 2028"));
    assert.equal(result.intro, "Program studi merupakan bagian dari perjalanan institusi.");
});

test("perubahan sejarah admin dan narasi tanpa tahun tidak memakai data contoh", () => {
    assert.deepEqual(profileHistory("Pada 2040, program studi memperoleh izin operasional.").events.map((item) => item.year), [2040]);
    const text = "Narasi baru tanpa tanggal.\n\nParagraf tetap lengkap.";
    assert.deepEqual(profileHistory(text).events, []);
    assert.equal(profileHistory(text).paragraphs.join("\n\n"), text);
    assert.deepEqual(profileHistory(null).events, []);
});

test("misi a sampai g mempertahankan isi, baris lanjutan, dan penulisan g tanpa spasi", () => {
    const source = "Misi ITB HAS:\na. Pendidikan;\nbaris lanjutan;\nb. Penelitian;\nc. Pengabdian;\nd. Kewirausahaan;\ne. Tata kelola;\nf. Kemitraan;\ng.Mengintegrasikan keberlanjutan.";
    const result = profileMission(source);
    assert.equal(result.items.length, 7);
    assert.equal(result.items[0].text, "Pendidikan;\nbaris lanjutan;");
    assert.equal(result.items[6].text, "Mengintegrasikan keberlanjutan.");
    assert.ok(institutionalLabel(source, "Misi"));
    assert.equal(purposeText("Visi ITB HAS: Teks visi.", "Visi"), "Teks visi.");
    assert.equal(purposeText("Visi prodi: Tetap lengkap.", "Visi"), "Visi prodi: Tetap lengkap.");
});

test("urutan misi tidak lengkap tetap ditampilkan sebagai teks dan angka tetap berurutan", () => {
    const text = "a. Pertama;\nc. Ketiga.";
    assert.equal(profileMission(text).items.length, 0);
    assert.equal(profileMission(text).fallback.join("\n\n"), text);
    assert.deepEqual(profileMission("1. Satu\n2. Dua").items.map((item) => item.marker), ["1", "2"]);
    assert.equal(profileMission("Kalimat biasa tanpa daftar.").fallback[0], "Kalimat biasa tanpa daftar.");
});

test("akreditasi diambil dari kolomnya sendiri dan huruf pada nomor SK tidak dianggap peringkat", () => {
    const text = "Pada 2023, memperoleh akreditasi Baik Sekali dari LAMEMBA berdasarkan SK Nomor 726/DE/A.5/AR.10/IX/2023. Masa berlaku sampai 2028.";
    const data = profileAccreditation(text);
    assert.equal(data.grade, "Baik Sekali");
    assert.equal(data.decree, "726/DE/A.5/AR.10/IX/2023");
    assert.equal(data.year, "2023");
    assert.equal(data.agency, "LAMEMBA");
    assert.equal(data.text, text);
    assert.equal(profileAccreditation("SK Nomor 726/DE/A.5/AR.10/IX/2023").grade, null);
    assert.equal(profileAccreditation("Baik Sekali").grade, "Baik Sekali");
    assert.equal(profileAccreditation(null).grade, null);
});

test("tautan dokumen menolak skema berbahaya, kredensial, dan path lokal tak dikenal", () => {
    for (const value of ["javascript:alert(1)", "data:text/html,test", "//example.com/a.pdf", "/admin", "/dokumen/../admin", "https://user:pass@example.com/a.pdf", "https://example.com/a\nb", "https:\\example.com/a.pdf"]) {
        assert.equal(profileDocumentUrl(value), null, value);
    }
    for (const value of ["/dokumen/akreditasi.pdf", "/dokumen/unggahan/" + "a".repeat(32) + ".pdf", "https://example.com/dokumen.pdf"]) {
        assert.equal(profileDocumentUrl(value), value);
    }
});

test("status dengan tanda kutip dikenali tanpa menambahkan metadata yang belum diisi", () => {
    for (const text of ['Terakreditasi "Baik Sekali"', 'Terakreditasi “Baik Sekali”', "'Baik Sekali'", 'Status: "Baik Sekali".']) {
        const data = profileAccreditation(text);
        assert.equal(data.grade, "Baik Sekali");
        assert.equal(data.statusOnly, true);
        assert.equal(data.text, text);
        assert.equal(data.agency, null);
        assert.equal(data.decree, null);
        assert.equal(data.year, null);
    }
    const text = 'Terakreditasi "Baik Sekali". Informasi tambahan tetap ditampilkan.';
    assert.equal(profileAccreditation(text).statusOnly, false);
    assert.equal(profileAccreditation(text).text, text);
    assert.equal(profileAccreditation(null).statusOnly, false);
    assert.equal(profileDocumentUrl("https://drive.google.com/file/d/contoh/view?usp=sharing"), "https://drive.google.com/file/d/contoh/view?usp=sharing");
});
