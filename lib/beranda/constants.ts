export const FOTO_BERANDA_FIELDS = [
    {
        name: "fotoKegiatanKampus",
        label: "Foto Kegiatan Kampus",
        description: "Tampil pada bagian utama beranda.",
        cropAspect: "4/3",
    },
    {
        name: "fotoKurikulum",
        label: "Foto Kurikulum",
        description: "Tampil pada kartu Kurikulum di Info Akademik.",
        cropAspect: "16/10",
    },
    {
        name: "fotoKalenderAkademik",
        label: "Foto Kalender Akademik",
        description:
            "Tampil pada kartu Kalender Akademik di Info Akademik.",
        cropAspect: "16/10",
    },
    {
        name: "fotoPendaftaran",
        label: "Foto Pendaftaran",
        description: "Tampil pada kartu Pendaftaran di Info Akademik.",
        cropAspect: "16/10",
    },
] as const;

export type FotoBerandaKey =
    (typeof FOTO_BERANDA_FIELDS)[number]["name"];

export type FotoBerandaValues = Record<
    FotoBerandaKey,
    string | null
>;