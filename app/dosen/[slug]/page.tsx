import Image from "next/image";
import { db } from "@/prisma/db";
import { notFound } from "next/navigation";

interface DosenDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function DosenDetailPage({
  params,
}: DosenDetailPageProps) {
  const { slug } = await params;
  const dosen = await db.orm.public.Dosen.all();
  const item = dosen.find((dosen) => dosen.slug === slug);

  if (!item) {
    notFound();
  }

  return (
    <main>
      <section>
        <Image
          src={item.foto || "/dosen/default.jpg"}
          alt={item.nama}
          width={300}
          height={300}
        />

        <h1>{item.nama}</h1>
        <p>NIDN: {item.nidn}</p>
        <p>Pendidikan: {item.pendidikan}</p>
      </section>

      <section>
        <h2>Profil</h2>
        <p>{item.profil || "Profil belum tersedia."}</p>
      </section>
    </main>
  );
}