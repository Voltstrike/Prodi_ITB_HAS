export type InformasiAkademik = {
  id: number;
  judul: string;
  deskripsi: string;
};

export const informasiAkademik: InformasiAkademik[] = [
  {
    id: 1,
    judul: "Perkuliahan",
    deskripsi:
      "Informasi mengenai pelaksanaan kegiatan perkuliahan Program Studi Magister Manajemen.",
  },
  {
    id: 2,
    judul: "KRS",
    deskripsi:
      "Informasi mengenai pengisian dan perubahan Kartu Rencana Studi.",
  },
  {
    id: 3,
    judul: "Ujian",
    deskripsi:
      "Informasi mengenai pelaksanaan ujian dan evaluasi akademik mahasiswa.",
  },
];