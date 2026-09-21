import Link from "next/link";
import { berita } from "@/data/berita";

export default function News() {
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
          {berita.map((item) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white"
            >
              {/* Image */}
              <img
                src={item.image}
                alt={item.title}
                className="aspect-16/10 w-full object-cover"
              />

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