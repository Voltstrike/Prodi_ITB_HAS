export type MataKuliah = {
  id: number;
  kode: string;
  nama: string;
  sks: number;
  semester: number;
  jenis: "Wajib" | "Pilihan";
};

export const kurikulum: MataKuliah[] = [
  {
    id: 1,
    kode: "MM001",
    nama: "Manajemen Strategik",
    sks: 3,
    semester: 1,
    jenis: "Wajib",
  },
  {
    id: 2,
    kode: "MM002",
    nama: "Manajemen Keuangan",
    sks: 3,
    semester: 1,
    jenis: "Wajib",
  },
];