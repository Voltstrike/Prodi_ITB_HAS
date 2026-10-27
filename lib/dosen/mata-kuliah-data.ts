import { db } from "@/prisma/db";

export type MataKuliahDosen = {
    id: number;
    kode: string;
    nama: string;
    sks: number;
    semester: number;
};
export async function getMataKuliahDosen(dosenId?: number) {
    const query = db.orm.public.DosenMataKuliah;
    const hubungan = dosenId === undefined
        ? await query.include("kurikulum").all()
        : await query.where({ dosenId }).include("kurikulum").all();

    const hasil = new Map<number, MataKuliahDosen[]>();

    for (const row of hubungan) {
        const mataKuliah = row.kurikulum;
        const daftar = hasil.get(row.dosenId) ?? [];

        daftar.push({
            id: mataKuliah.id,
            kode: mataKuliah.kode,
            nama: mataKuliah.nama,
            sks: mataKuliah.sks,
            semester: mataKuliah.semester,
        });

        hasil.set(row.dosenId, daftar);
    }

    for (const daftar of hasil.values()) {
        daftar.sort((a, b) =>
            a.semester - b.semester || a.kode.localeCompare(b.kode),
        );
    }

    return hasil;
}