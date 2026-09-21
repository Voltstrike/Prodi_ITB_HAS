export type Berita = {
  id: number;
  title: string;
  date: string;
  description: string;
  image: string;
  slug: string;
  content: string;
};

export const berita: Berita[] = [
  {
    id: 1,
    title: "Kegiatan Akademik Magister Manajemen",
    date: "12 September 2026",
    description:
      "Informasi mengenai kegiatan akademik terbaru Program Studi Magister Manajemen.",
    image: "/news-1.jpg",
    slug: "kegiatan-akademik",
    content:
      "Isi lengkap berita mengenai kegiatan akademik Magister Manajemen.",
  },
  {
    id: 2,
    title: "Seminar dan Kegiatan Mahasiswa",
    date: "8 September 2026",
    description:
      "Program Studi Magister Manajemen menyelenggarakan kegiatan untuk meningkatkan wawasan mahasiswa.",
    image: "/news-2.jpg",
    slug: "seminar-mahasiswa",
    content:
      "Isi lengkap berita mengenai seminar dan kegiatan mahasiswa.",
  },
  {
    id: 3,
    title: "Informasi Terbaru Program Studi",
    date: "3 September 2026",
    description:
      "Simak berbagai informasi terbaru dari Program Studi Magister Manajemen.",
    image: "/news-3.jpg",
    slug: "informasi-terbaru",
    content:
      "Isi lengkap berita mengenai informasi terbaru Program Studi.",
  },
];