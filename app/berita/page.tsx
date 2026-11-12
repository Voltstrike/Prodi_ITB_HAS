import type { Metadata } from "next";
import ImageWithFallback from "@/components/ImageWithFallback";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { NEWS_MAX_QUERY_LENGTH, parseNewsListFilters, newsPageHref } from "@/lib/berita/list-filters";
import { getPublishedNewsPage, type PublishedNewsPage } from "@/lib/berita/list";

export const metadata: Metadata = {
  title: "Berita | Magister Manajemen ITB HAS",
  description:
    "Berita dan kegiatan Program Studi Magister Manajemen ITB Haji Agus Salim.",
};

export const dynamic = "force-dynamic";

export default async function BeritaPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[];
    page?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const search = new URLSearchParams();

  for (const key of ["q", "page"] as const) {
    const value = params[key];
    if (Array.isArray(value)) {
      for (const item of value) search.append(key, item);
    } else if (typeof value === "string") {
      search.set(key, value);
    }
  }

  const parsed = parseNewsListFilters(search);
  const filters = parsed.ok ? parsed.filters : {
    q: typeof params.q === "string"
      ? params.q.slice(0, NEWS_MAX_QUERY_LENGTH).replace(/\p{Cc}/gu, "")
      : "",
    page: 1,
  };

  let message = parsed.ok ? "" : parsed.message;
  let result: PublishedNewsPage | null = null;

  if (parsed.ok) {
    try {
      result = await getPublishedNewsPage(filters);
    } catch (error) {
      console.error(
        "NEWS LIST ERROR:",
        error instanceof Error ? error.name : "UnknownError",
      );
      message = "Daftar berita sementara tidak tersedia. Silakan coba kembali.";
    }
  }

  const berita = result?.berita ?? [];
  const total = result?.total ?? 0;
  const totalPages = result?.totalPages ?? 1;
  const currentPage = result?.page ?? 1;

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
            <form
              key={filters.q}
              action="/berita"
              method="get"
              role="search"
              aria-label="Pencarian berita"
              className="mb-8 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="min-w-0 basis-full sm:basis-64 sm:flex-1">
                <label htmlFor="berita-search" className="text-sm font-medium text-slate-700">
                  Cari berita
                </label>
                <input
                  id="berita-search" name="q" type="search"
                  minLength={2} maxLength={NEWS_MAX_QUERY_LENGTH}
                  defaultValue={filters.q}
                  placeholder="Judul atau kata kunci berita..."
                  className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                />
              </div>

              <button
                type="submit"
                className="min-h-11 rounded-lg bg-blue-700 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
              >
                Cari
              </button>

              <Link
                href="/berita"
                prefetch={false}
                className="inline-flex min-h-11 items-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
              >
                Reset
              </Link>
            </form>

            {!message && filters.q && (
              <p className="mb-5 break-words text-sm text-slate-600">
                Hasil pencarian untuk “{filters.q}”.
              </p>
            )}

            <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
              <h2 id="daftar-berita" className="text-2xl font-bold text-slate-900">
                {filters.q ? "Hasil Pencarian Berita" : "Berita Terbaru"}
              </h2>
              {!message && <p className="text-sm text-slate-500">{total} {filters.q ? "hasil" : "berita"}</p>}
            </div>

            {message ? (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
                {message}
              </p>
            ) : berita.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center">
                <h3 className="text-lg font-semibold text-slate-900">
                  {filters.q ? "Berita tidak ditemukan" : "Belum ada berita"}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {filters.q ? "Coba kata kunci lain atau tekan Reset untuk melihat semua berita." : "Informasi dan kegiatan terbaru akan ditampilkan di halaman ini."}
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
                      {(item.thumbnail?.trim() || item.image?.trim()) ? (
                          <ImageWithFallback
                            src={item.thumbnail ?? item.image}
                            fallbackSrc={item.image}
                            alt={item.title}
                            fallback={
                              <div className="flex h-full items-center justify-center text-sm font-semibold tracking-wide text-blue-800">
                                MM ITB HAS
                              </div>
                            }
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
                    href={newsPageHref(filters, currentPage - 1)}
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
                    href={newsPageHref(filters, currentPage + 1)}
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
