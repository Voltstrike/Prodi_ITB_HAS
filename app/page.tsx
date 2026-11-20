import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import { PublishDate } from "@/components/akademik/InformasiSection";
import About from "@/components/About";
import AcademicInfo from "@/components/AcademicInfo";
import News from "@/components/News";
import Documents from "@/components/Documents";
import Footer from "@/components/Footer";
import { toBerandaDto } from "@/lib/http/dto";
import { db } from "@/prisma/db";

export const metadata: Metadata = {
  title: "S2 Magister Manajemen ITB Haji Agus Salim Bukittinggi",
  description: "Kenali program S2 Manajemen di Bukittinggi. Jelajahi profil prodi, kurikulum, dosen, dan panduan pendaftaran mahasiswa baru ITB Haji Agus Salim.",
  alternates: { canonical: "/" },
};

export const dynamic = "force-dynamic";

export default async function Home() {
  const [beranda, profil, pengumuman] = await Promise.all([
    db.orm.public.Beranda
      .where({ singletonKey: 1 })
      .first(),
    db.orm.public.Profil
      .select("fotoProdi")
      .where({ singletonKey: 1 })
      .first(),
    db.orm.public.InformasiAkademik
      .where({ status: "PUBLISHED", utama: true })
      .select("id", "judul", "diterbitkanPada", "createdAt")
      .first(),
  ]);

  const photos = toBerandaDto(beranda);
  return (
    <main>
      <Navbar />
      <Hero foto={photos.fotoKegiatanKampus} />
      {pengumuman && (
        <aside aria-labelledby="pengumuman-beranda" className="border-y border-blue-100 bg-blue-50">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-xs font-semibold text-blue-700">Informasi akademik</span>
                <PublishDate item={pengumuman} />
              </div>
              <h2 id="pengumuman-beranda" className="mt-1 break-words text-lg font-semibold text-slate-900">
                {pengumuman.judul}
              </h2>
            </div>
            <a href={`/akademik#pengumuman-${pengumuman.id}`}
              className="w-fit shrink-0 rounded text-sm font-semibold text-blue-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700">
              Baca pengumuman <span aria-hidden="true">→</span>
            </a>
          </div>
        </aside>
      )}
      <About foto={profil?.fotoProdi ?? null} />
      <AcademicInfo photos={photos} />
      <News />
      <Documents />
      <Footer />
    </main>
  );
}