import { db } from "@/prisma/db";
import { createAuditLog } from "@/lib/audit/log";
import {
    firstPublishedAt, isAcademicDate, isAcademicStatus, isAcademicYear,
} from "./policy";

export type Resource = "KalenderAkademik" | "InformasiAkademik";
type Body = Record<string, unknown>;
type Previous = {
    status: string;
    semester?: string | null;
    tahunAkademik?: string | null;
    keterangan?: string | null;
    utama?: boolean;
};

export class AcademicError extends Error {
    constructor(readonly status: number, message: string) {
        super(message);
    }
}

function invalid(message: string): never {
    throw new AcademicError(400, message);
}

function text(value: unknown, label: string, max: number): string {
    if (
        typeof value !== "string" || !value.trim() ||
        value.trim().length > max || value.includes("\0")
    ) {
        invalid(`${label} wajib berupa teks, maksimal ${max} karakter.`);
    }
    return value.trim();
}

function optional(value: unknown, label: string, max: number) {
    return value == null || value === "" ? null : text(value, label, max);
}

function keys(body: Body, allowed: string[]) {
    if (Object.keys(body).some(key => !allowed.includes(key))) {
        invalid("Ada kolom yang tidak dikenal.");
    }
}

function statusOf(body: Body, prev?: Previous | null) {
    const status = body.status === undefined ? prev?.status ?? "DRAFT" : body.status;
    if (!isAcademicStatus(status)) invalid("Status publikasi tidak valid.");
    return status;
}

export function calendarInput(body: Body, prev?: Previous | null) {
    keys(body, [
        "kegiatan", "tanggalMulai", "tanggalSelesai", "keterangan",
        "semester", "tahunAkademik", "status",
    ]);
    const kegiatan = text(body.kegiatan, "Nama kegiatan", 500);
    const tanggalMulai = body.tanggalMulai;
    const tanggalSelesai = body.tanggalSelesai == null || body.tanggalSelesai === ""
        ? tanggalMulai : body.tanggalSelesai;

    if (
        !isAcademicDate(tanggalMulai) || !isAcademicDate(tanggalSelesai) ||
        tanggalSelesai < tanggalMulai
    ) {
        invalid("Periksa tanggal mulai dan selesai kegiatan.");
    }

    const status = statusOf(body, prev);
    const saved = { ...prev, ...body };
    const semester = optional(saved.semester, "Semester", 6);
    const tahunAkademik = optional(saved.tahunAkademik, "Tahun akademik", 9);
    if (semester && semester !== "GANJIL" && semester !== "GENAP") {
        invalid("Semester tidak valid.");
    }
    if (tahunAkademik && !isAcademicYear(tahunAkademik)) {
        invalid("Contoh tahun akademik yang benar adalah 2026/2027.");
    }

    // Form lama dapat mengedit kegiatan terbit yang belum mempunyai periode.
    const keepLegacyPeriod = prev?.status === "PUBLISHED" &&
        body.semester === undefined && body.tahunAkademik === undefined;
    if (status === "PUBLISHED" && (!semester || !tahunAkademik) && !keepLegacyPeriod) {
        invalid("Isi semester dan tahun akademik untuk menerbitkan kegiatan.");
    }

    return {
        kegiatan, tanggalMulai, tanggalSelesai, semester, tahunAkademik, status,
        keterangan: optional(saved.keterangan, "Keterangan", 2000),
    };
}

export function infoInput(body: Body, prev?: Previous | null) {
    keys(body, ["judul", "deskripsi", "status", "utama"]);
    const utama = body.utama === undefined ? prev?.utama ?? false : body.utama;
    if (typeof utama !== "boolean") invalid("Pilihan informasi utama tidak valid.");
    return {
        judul: text(body.judul, "Judul", 300),
        deskripsi: text(body.deskripsi, "Deskripsi", 10000),
        utama,
        status: statusOf(body, prev),
    };
}

export async function saveAcademic(
    resource: Resource, userId: number, id: number | null, body: Body,
) {
    return db.transaction(async tx => {
        const audit = (entityId: number, details: string, action = id === null ? "CREATE" : "UPDATE") =>
            createAuditLog({ userId, entity: resource, entityId, action, details, dbClient: tx });

        if (resource === "KalenderAkademik") {
            const table = tx.orm.public.KalenderAkademik;
            if (id !== null) {
                await tx.query(db.raw.sql`
                    SELECT id FROM public."kalenderAkademik"
                    WHERE id = ${id} FOR UPDATE
                `.returnsRow({ id: "pg/int4@1" }).build());
            }
            const prev = id === null ? null : await table.where({ id }).first();
            if (id !== null && !prev) throw new AcademicError(404, "Kegiatan tidak ditemukan.");
            const data = calendarInput(body, prev);
            const row = id === null ? await table.create(data) : await table.where({ id }).update(data);
            if (!row) throw new AcademicError(404, "Kegiatan tidak ditemukan.");
            await audit(row.id, `${row.kegiatan} (${row.status})`);
            return row;
        }

        // Urutkan perubahan informasi, termasuk dua admin yang memilih informasi utama bersamaan.
        await tx.query(db.raw.sql`
            SELECT 1 AS locked FROM pg_advisory_xact_lock(73114, 1)
        `.returnsRow({ locked: "pg/int4@1" }).build());

        const table = tx.orm.public.InformasiAkademik;
        const prev = id === null ? null : await table.where({ id }).first();
        if (id !== null && !prev) throw new AcademicError(404, "Informasi tidak ditemukan.");
        const input = infoInput(body, prev);

        if (input.utama && input.status === "PUBLISHED") {
            const old = await table.where({ status: "PUBLISHED", utama: true }).first();
            if (old && old.id !== id) {
                await table.where({ id: old.id }).update({ utama: false });
                await audit(old.id, "Mengganti penanda informasi utama.", "UPDATE");
            }
        }

        const data = { ...input, diterbitkanPada: firstPublishedAt(prev, input.status) };
        const row = id === null ? await table.create(data) : await table.where({ id }).update(data);
        if (!row) throw new AcademicError(404, "Informasi tidak ditemukan.");
        await audit(row.id, `${row.judul} (${row.status})`);
        return row;
    });
}
