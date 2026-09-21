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
          src={item.foto}
          alt={item.nama}
          width={300}
          height={300}
        />

        <h1>{item.nama}</h1>
        <p>{item.jabatan}</p>
        <p>NIDN: {item.nidn}</p>
        <p>{item.bidangKeahlian}</p>
      </section>

      <section>
        <h2>Profil</h2>
        <p>{item.profil}</p>
      </section>

      <section>
        <h2>Pendidikan</h2>
        <p>{item.pendidikan}</p>
      </section>

      <section>
        <h2>Email</h2>
        <p>{item.email}</p>
      </section>
    </main>
  );
}