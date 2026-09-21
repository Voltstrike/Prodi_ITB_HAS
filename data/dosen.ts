export type Dosen = {
  id: number;
  nama: string;
  slug: string;
  nidn: string;
  jabatan: string;
  bidangKeahlian: string;
  foto: string;
  email: string;
  pendidikan: string;
  profil: string;
};

export const dosen: Dosen[] = [
  {
    id: 1,
    nama: "Nama Dosen 1",
    slug: "nama-dosen-1",
    nidn: "0000000000",
    jabatan: "Dosen",
    bidangKeahlian: "Manajemen",
    foto: "/dosen/default.jpg",
    email: "dosen1@example.com",
    pendidikan: "S3 Manajemen",
    profil:
      "Profil singkat mengenai dosen dan bidang keahliannya.",
  },
  {
    id: 2,
    nama: "Nama Dosen 2",
    slug: "nama-dosen-2",
    nidn: "0000000000",
    jabatan: "Dosen",
    bidangKeahlian: "Manajemen Keuangan",
    foto: "/dosen/default.jpg",
    email: "dosen2@example.com",
    pendidikan: "S3 Manajemen",
    profil:
      "Profil singkat mengenai dosen dan bidang keahliannya.",
  },
];