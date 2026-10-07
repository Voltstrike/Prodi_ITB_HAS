import type { db } from "@/prisma/db";

type DosenRow = NonNullable<Awaited<ReturnType<typeof db.orm.public.Dosen.first>>>;

export function toDosenDto(row: DosenRow) {
    return {
        id: row.id,
        nama: row.nama,
        slug: row.slug,
        nidn: row.nidn,
        foto: row.foto,
        pendidikanS1: row.pendidikanS1,
        pendidikanS2: row.pendidikanS2,
        pendidikanS3: row.pendidikanS3,
        profil: row.profil,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
}

type StaffRow = NonNullable<Awaited<ReturnType<typeof db.orm.public.Staff.first>>>;

export function toStaffDto(row: StaffRow) {
    return {
        id: row.id,
        nama: row.nama,
        pendidikan: row.pendidikan,
        jabatan: row.jabatan,
        lingkupKerja: row.lingkupKerja,
        foto: row.foto,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
}

type BeritaRow = NonNullable<Awaited<ReturnType<typeof db.orm.public.Berita.first>>>;

export function toBeritaDto(row: BeritaRow) {
    return {
        id: row.id,
        title: row.title,
        date: row.date,
        description: row.description,
        image: row.image,
        slug: row.slug,
        content: row.content,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
}

type KurikulumRow = NonNullable<Awaited<ReturnType<typeof db.orm.public.Kurikulum.first>>>;

export function toKurikulumDto(row: KurikulumRow) {
    return {
        id: row.id,
        kode: row.kode,
        nama: row.nama,
        sks: row.sks,
        semester: row.semester,
        jenis: row.jenis,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
}

type KalenderAkademikRow = NonNullable<Awaited<ReturnType<typeof db.orm.public.KalenderAkademik.first>>>;

export function toKalenderAkademikDto(row: KalenderAkademikRow) {
    return {
        id: row.id,
        kegiatan: row.kegiatan,
        tanggalMulai: row.tanggalMulai,
        tanggalSelesai: row.tanggalSelesai,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
}

type InformasiAkademikRow = NonNullable<Awaited<ReturnType<typeof db.orm.public.InformasiAkademik.first>>>;

export function toInformasiAkademikDto(row: InformasiAkademikRow) {
    return {
        id: row.id,
        judul: row.judul,
        deskripsi: row.deskripsi,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
}

type ProfilRow = NonNullable<Awaited<ReturnType<typeof db.orm.public.Profil.first>>>;

export function toProfilDto(row: ProfilRow) {
    return {
        id: row.id,
        sejarah: row.sejarah,
        visi: row.visi,
        misi: row.misi,
        struktur: row.struktur,
        akreditasi: row.akreditasi,
        dokumenAkreditasi: row.dokumenAkreditasi,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
}
