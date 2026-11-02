import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import AcademicInfo from "@/components/AcademicInfo";
import News from "@/components/News";
import Documents from "@/components/Documents";
import Footer from "@/components/Footer";
import { toBerandaDto } from "@/lib/http/dto";
import { db } from "@/prisma/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [beranda, profil] = await Promise.all([
    db.orm.public.Beranda
      .where({ singletonKey: 1 })
      .first(),
    db.orm.public.Profil
      .select("fotoProdi")
      .where({ singletonKey: 1 })
      .first(),
  ]);

  const photos = toBerandaDto(beranda);
  return (
    <main>
      <Navbar />
      <Hero foto={photos.fotoKegiatanKampus} />
      <About foto={profil?.fotoProdi ?? null} />
      <AcademicInfo photos={photos} />
      <News />
      <Documents />
      <Footer />
    </main>
  );
}