import Link from "next/link";
import { db } from "@/prisma/db";

export default async function News() {
  const berita = await db.orm.public.Berita
    .select("id", "title", "date", "description", "slug")
    .orderBy([(item) => item.createdAt.desc(), (item) => item.id.desc()])
    .limit(3)
    .all();

  return (
    <section className="bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-6xl">

        {/* Heading */}
        <div className="flex items-end justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold text-blue-600">
              INFORMASI
            </p>

            <h2 className="text-3xl font-bold text-slate-900">
              Berita Terbaru
            </h2>

            <p className="mt-3 max-w-2xl text-slate-600">
              Informasi dan berita terbaru seputar kegiatan Program
              Studi Magister Manajemen.
            </p>
          </div>

          <Link
            href="/berita"
            className="hidden text-sm font-medium text-blue-600 hover:underline md:block"
          >
            Lihat Semua →
          </Link>
        </div>

        {/* News Cards */}
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {berita.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center md:col-span-3">
              <h3 className="text-lg font-semibold text-slate-900">
                Belum ada berita
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Informasi dan kegiatan terbaru akan ditampilkan di sini.
              </p>
            </div>
          )}

          {berita.map((item) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white"
            >
              {/* Image */}
              <div
                className="flex aspect-16/10 w-full items-center justify-center bg-slate-200 p-6 text-center text-sm text-slate-600"
              >
                Foto berita belum tersedia
              </div>

              {/* Content */}
              <div className="p-5">
                <p className="text-xs font-medium text-slate-500">
                  {item.date}
                </p>

                <h3 className="mt-2 text-lg font-semibold leading-snug text-slate-900">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {item.description}
                </p>

                <Link
                  href={`/berita/${item.slug}`}
                  className="mt-4 inline-block text-sm font-medium text-slate-900 hover:underline"
                >
                  Baca Selengkapnya →
                </Link>
              </div>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
}