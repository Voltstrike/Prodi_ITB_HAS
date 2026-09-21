import Link from "next/link";
import { db } from "@/prisma/db";

export default async function BeritaPage() {
  const berita = await db.orm.public.Berita.all();
  return (
    <main>
      {/* Page Header */}
      <section>
        <h1>Berita</h1>
        <p>
          Informasi dan berita terbaru dari Program Studi
          Magister Manajemen Institut Teknologi dan Bisnis Haji Agus Salim.
        </p>
      </section>

      {/* Daftar Berita */}
      <section>
        <h2>Berita Terbaru</h2>

        <div>
          {berita.map((item) => (
            <article key={item.id}>
              <Link href={`/berita/${item.slug}`}>
                <h3>{item.title}</h3>

                <p>{item.description}</p>

                <p>{item.date}</p>

                <p>Baca Selengkapnya →</p>
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
} 