import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { db } from "@/prisma/db";

export const metadata: Metadata = {
  title: "Berita | Magister Manajemen ITB HAS",
  description:
    "Berita dan kegiatan Program Studi Magister Manajemen ITB Haji Agus Salim.",
};

export const dynamic = "force-dynamic";

const PAGE_SIZE = 9;

export default async function BeritaPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawPage = typeof params.page === "string" ? params.page : "1";
  const parsedPage = /^\d+$/.test(rawPage) ? Number(rawPage) : 1;
  const requestedPage =
    Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const { total } = await db.orm.public.Berita.aggregate((a) => ({
    total: a.count(),
  }));
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);

  const berita = await db.orm.public.Berita
    .select("id", "title", "date", "description", "image", "slug")
    .orderBy([(item) => item.createdAt.desc(), (item) => item.id.desc()])
    .offset((currentPage - 1) * PAGE_SIZE)
    .limit(PAGE_SIZE)
    .all();

  return (
    <>
      <Navbar />

      <main className="flex-1 bg-slate-50">
        <section className="border-b border-slate-200 bg-white px-6 py-12 md:py-16">
          <div className="mx-auto max-w-6xl">
            <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-500">
              <Link href="/" className="transition hover:text-blue-700">
                Beranda
              </Link>
              <span aria-hidden="true" className="mx-3">/</span>
              <span aria-current="page" className="text-slate-900">Berita</span>
            </nav>

            <p className="mb-2 text-sm font-semibold text-blue-600">
              INFORMASI
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              Berita &amp; Kegiatan
            </h1>
            <p className="mt-4 max-w-2xl leading-relaxed text-slate-600">
              Informasi terbaru seputar kegiatan akademik dan Program Studi
              Magister Manajemen Institut Teknologi dan Bisnis Haji Agus Salim.
            </p>
          </div>
        </section>

        <section aria-labelledby="daftar-berita" className="px-6 py-12 md:py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
              <h2 id="daftar-berita" className="text-2xl font-bold text-slate-900">
                Berita Terbaru
              </h2>
              <p className="text-sm text-slate-500">{total} berita</p>
            </div>

            {berita.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center">
                <h3 className="text-lg font-semibold text-slate-900">
                  Belum ada berita
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Informasi dan kegiatan terbaru akan ditampilkan di halaman ini.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {berita.map((item) => (
                  <article
                    key={item.id}
                    className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-blue-200 hover:shadow-md"
                  >
                    <Link
                      href={`/berita/${item.slug}`}
                      className="flex h-full flex-col focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-blue-600"
                    >
                      <div className="relative aspect-16/10 overflow-hidden bg-blue-50">
                        {item.image?.trim() ? (
                          <Image
                            src={item.image}
                            alt={item.title}
                            fill
                            unoptimized
                            sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm font-semibold tracking-wide text-blue-800">
                            MM ITB HAS
                          </div>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col p-5">
                        <p className="text-xs font-medium text-slate-500">
                          {item.date}
                        </p>
                        <h3 className="mt-2 text-lg font-semibold leading-snug text-slate-900 transition group-hover:text-blue-700">
                          {item.title}
                        </h3>
                        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">
                          {item.description}
                        </p>
                        <span className="mt-auto block pt-5 text-sm font-semibold text-blue-700">
                          Baca Selengkapnya <span aria-hidden="true">→</span>
                        </span>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <nav
                aria-label="Halaman berita"
                className="mt-10 flex flex-wrap items-center justify-center gap-4"
              >
                {currentPage > 1 ? (
                  <Link
                    href={currentPage === 2 ? "/berita" : `/berita?page=${currentPage - 1}`}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
                  >
                    Sebelumnya
                  </Link>
                ) : (
                  <span aria-disabled="true" className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-400">
                    Sebelumnya
                  </span>
                )}

                <span className="text-sm text-slate-600">
                  Halaman {currentPage} dari {totalPages}
                </span>

                {currentPage < totalPages ? (
                  <Link
                    href={`/berita?page=${currentPage + 1}`}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
                  >
                    Berikutnya
                  </Link>
                ) : (
                  <span aria-disabled="true" className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-400">
                    Berikutnya
                  </span>
                )}
              </nav>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
