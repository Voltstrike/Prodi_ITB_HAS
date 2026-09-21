export type KalenderAkademik = {
  id: number;
  kegiatan: string;
  tanggalMulai: string;
  tanggalSelesai: string;
};

export const kalenderAkademik: KalenderAkademik[] = [
  {
    id: 1,
    kegiatan: "Pengisian KRS",
    tanggalMulai: "1 September 2026",
    tanggalSelesai: "7 September 2026",
  },
  {
    id: 2,
    kegiatan: "Perkuliahan Semester Ganjil",
    tanggalMulai: "8 September 2026",
    tanggalSelesai: "31 Januari 2027",
  },
];