import assert from "node:assert/strict";
import { test } from "node:test";
import {
    BERITA_TEXT_LIMITS,
    validateBeritaInput,
} from "../lib/berita/validation";

const complete = {
    title: "Berita pengujian",
    date: "10 November 2026",
    description: "Deskripsi pengujian.",
    image: "/media/uji-berita.webp",
    thumbnail: null,
    content: "Isi berita pengujian.",
    status: "PUBLISHED",
};

test("berita baru menjadi DRAFT dan cukup memiliki judul", () => {
    const result = validateBeritaInput({ title: "  Rencana kegiatan  " });
    if (!result.ok) assert.fail(result.message);

    assert.equal(result.data.status, "DRAFT");
    assert.equal(result.data.title, "Rencana kegiatan");
    assert.equal(result.data.date, "");
    assert.equal(result.data.description, "");
    assert.equal(result.data.image, "");
    assert.equal(result.data.content, "");
    assert.equal(result.data.thumbnail, null);
});

test("penerbitan membutuhkan semua field wajib", () => {
    const valid = validateBeritaInput(complete);
    assert.equal(valid.ok, true);

    for (const field of [
        "title", "date", "description", "image", "content",
    ]) {
        assert.equal(
            validateBeritaInput({ ...complete, [field]: "   " }).ok,
            false,
            `${field} kosong harus ditolak saat terbit`,
        );
    }
});

test("status lama dapat dipertahankan jika status tidak dikirim", () => {
    const result = validateBeritaInput(
        { ...complete, status: undefined },
        "PUBLISHED",
    );
    if (!result.ok) assert.fail(result.message);
    assert.equal(result.data.status, "PUBLISHED");

    assert.equal(
        validateBeritaInput({ title: "Belum lengkap" }, "PUBLISHED").ok,
        false,
    );

    const draft = validateBeritaInput(
        { title: "Belum lengkap", status: "DRAFT" },
        "PUBLISHED",
    );
    if (!draft.ok) assert.fail(draft.message);
    assert.equal(draft.data.status, "DRAFT");
});

test("status tidak dikenal dan field tambahan ditolak", () => {
    for (const status of [null, true, 1, "published", "TERBIT", ""]) {
        assert.equal(
            validateBeritaInput({ title: "Uji", status }).ok,
            false,
        );
    }

    for (const field of ["id", "slug", "userId", "createdAt"]) {
        assert.equal(
            validateBeritaInput({ ...complete, [field]: 1 }).ok,
            false,
        );
    }
});

test("tipe teks salah dan karakter kontrol ditolak", () => {
    for (const field of Object.keys(BERITA_TEXT_LIMITS)) {
        for (const value of [true, 123, [], {}]) {
            assert.equal(
                validateBeritaInput({ ...complete, [field]: value }).ok,
                false,
            );
        }
    }

    assert.equal(
        validateBeritaInput({ title: "Uji", content: "teks\u0000rusak" }).ok,
        false,
    );
});

test("batas panjang berlaku juga untuk draft", () => {
    for (const [field, limit] of Object.entries(BERITA_TEXT_LIMITS)) {
        assert.equal(
            validateBeritaInput({
                ...complete,
                status: "DRAFT",
                [field]: "x".repeat(limit + 1),
            }).ok,
            false,
        );
    }

    assert.equal(
        validateBeritaInput({ title: "x".repeat(300) }).ok,
        true,
    );
    assert.equal(
        validateBeritaInput({ title: "Uji", content: "x".repeat(100000) }).ok,
        true,
    );
});

test("alamat gambar berbahaya ditolak meskipun masih draft", () => {
    for (const field of ["image", "thumbnail"]) {
        assert.equal(
            validateBeritaInput({
                title: "Uji",
                [field]: "javascript:alert(1)",
            }).ok,
            false,
        );
    }
});

test("thumbnail yang tidak dikirim dibedakan dari penghapusan eksplisit", () => {
    const omitted = validateBeritaInput({ title: "Uji" });
    const cleared = validateBeritaInput({ title: "Uji", thumbnail: null });

    if (!omitted.ok) assert.fail(omitted.message);
    if (!cleared.ok) assert.fail(cleared.message);

    assert.equal(omitted.thumbnailProvided, false);
    assert.equal(cleared.thumbnailProvided, true);
    assert.equal(cleared.data.thumbnail, null);
});
