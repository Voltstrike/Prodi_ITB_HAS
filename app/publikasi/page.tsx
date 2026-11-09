import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
    parsePublicationFilters,
    publicationHref,
} from "@/lib/publikasi/filters";
import { getPublicationsPage } from "@/lib/publikasi/queries";
import {
    publicationAuthors,
    publicationMaxYear,
} from "@/lib/publikasi/validation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Publikasi Ilmiah | Magister Manajemen ITB HAS",
    description:
        "Daftar tesis dan artikel ilmiah yang telah diterbitkan, beserta penulis dan tautan sumber publikasinya.",
};

export default async function PublicationsPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const values = await searchParams;
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(values)) {
        if (typeof value === "string") params.append(key, value);
        else if (Array.isArray(value)) {
            for (const item of value) params.append(key, item);
        }
    }

    const parsed = parsePublicationFilters(params, "public");

    if (!parsed.ok) {
        return (
            <>
                <Navbar />
                <main className="mx-auto w-full max-w-6xl flex-1 space-y-5 px-6 py-16">
                    <h1 className="text-3xl font-bold text-slate-900">
                        Publikasi Ilmiah
                    </h1>
                    <p role="alert" className="text-slate-600">
                        Filter pencarian tidak valid. Periksa tahun atau halaman.
                    </p>
                    <Link href="/publikasi" className="text-blue-700 underline">
                        Reset pencarian
                    </Link>
                </main>
                <Footer />
            </>
        );
    }

    const filters = parsed.filters;
    const { publications, total, page, totalPages } =
        await getPublicationsPage(filters);

    const inputClass =
        "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900";
    const linkClass =
        "rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50";

    return (
        <>
            <Navbar />

            <main className="flex-1 bg-slate-50">
                <section className="border-b border-slate-200 bg-white px-6 py-12 md:py-16">
                    <div className="mx-auto max-w-6xl">
                        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-500">
                            <Link href="/" className="hover:text-blue-700">Beranda</Link>
                            <span aria-hidden="true" className="mx-3">/</span>
                            <Link href="/kegiatan-prodi" className="hover:text-blue-700">
                                Penelitian &amp; Pengabdian
                            </Link>
                            <span aria-hidden="true" className="mx-3">/</span>
                            <span aria-current="page">Publikasi Ilmiah</span>
                        </nav>

                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                            Publikasi Ilmiah
                        </h1>
                        <p className="mt-4 max-w-2xl leading-relaxed text-slate-600">
                            Temukan tesis dan artikel ilmiah yang telah diterbitkan.
                            Informasi karya disertai tautan menuju jurnal atau
                            repositori sumbernya.
                        </p>
                    </div>
                </section>

                <section aria-labelledby="publication-list" className="px-6 py-12">
                    <div className="mx-auto max-w-6xl space-y-8">
                        <form
                            key={params.toString()}
                            action="/publikasi"
                            method="get"
                            className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4"
                        >
                            <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                                Cari publikasi
                                <input
                                    name="q"
                                    maxLength={200}
                                    defaultValue={filters.q}
                                    placeholder="Judul, penulis, sumber, atau DOI"
                                    className={inputClass}
                                />
                            </label>

                            <label className="text-sm font-medium text-slate-700">
                                Jenis
                                <select
                                    name="jenis"
                                    defaultValue={filters.jenis}
                                    className={inputClass}
                                >
                                    <option value="">Semua jenis</option>
                                    <option value="TESIS">Tesis</option>
                                    <option value="ARTIKEL">Artikel ilmiah</option>
                                </select>
                            </label>

                            <label className="text-sm font-medium text-slate-700">
                                Tahun
                                <input
                                    type="number"
                                    name="tahun"
                                    min={1900}
                                    max={publicationMaxYear()}
                                    step={1}
                                    defaultValue={filters.tahun ?? ""}
                                    placeholder="Semua tahun"
                                    className={inputClass}
                                />
                            </label>

                            <div className="flex items-center gap-4 sm:col-span-2 lg:col-span-4">
                                <button
                                    type="submit"
                                    className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
                                >
                                    Cari
                                </button>
                                <Link href="/publikasi" className="text-sm text-blue-700 hover:underline">
                                    Reset
                                </Link>
                            </div>
                        </form>

                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h2 id="publication-list" className="text-2xl font-bold text-slate-900">
                                Daftar Publikasi
                            </h2>
                            <p className="text-sm text-slate-500">{total} publikasi</p>
                        </div>

                        {publications.length === 0 ? (
                            <p className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center text-slate-600">
                                {filters.q || filters.jenis || filters.tahun
                                    ? "Tidak ada publikasi yang sesuai dengan pencarian."
                                    : "Belum ada publikasi yang ditampilkan."}
                            </p>
                        ) : (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {publications.map((item) => (
                                    <article
                                        key={item.id}
                                        className="flex min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-6"
                                    >
                                        <p className="text-xs font-semibold text-blue-700">
                                            {item.jenis === "TESIS" ? "Tesis" : "Artikel ilmiah"}
                                            {" · "}{item.tahun}
                                        </p>
                                        <h3 className="mt-3 break-words text-lg font-bold leading-snug text-slate-900">
                                            <Link
                                                href={`/publikasi/${encodeURIComponent(item.slug)}`}
                                                className="hover:text-blue-700 hover:underline"
                                            >
                                                {item.judul}
                                            </Link>
                                        </h3>
                                        <p className="mt-4 line-clamp-3 break-words text-sm text-slate-600">
                                            {publicationAuthors(item.penulis).join("; ")}
                                        </p>
                                        <p className="mt-3 break-words text-xs text-slate-500">
                                            {item.sumber}
                                        </p>
                                        {item.ringkasan && (
                                            <p className="mt-4 line-clamp-3 break-words text-sm leading-relaxed text-slate-600">
                                                {item.ringkasan}
                                            </p>
                                        )}
                                        <Link
                                            href={`/publikasi/${encodeURIComponent(item.slug)}`}
                                            aria-label={`Lihat detail ${item.judul}`}
                                            className="mt-auto pt-6 text-sm font-semibold text-blue-700 hover:underline"
                                        >
                                            Lihat detail →
                                        </Link>
                                    </article>
                                ))}
                            </div>
                        )}

                        {totalPages > 1 && (
                            <nav
                                aria-label="Halaman publikasi"
                                className="flex flex-wrap items-center justify-center gap-4 pt-4"
                            >
                                {page > 1 && (
                                    <Link href={publicationHref(filters, page - 1)} className={linkClass}>
                                        Sebelumnya
                                    </Link>
                                )}
                                <span className="text-sm text-slate-600">
                                    Halaman {page} dari {totalPages}
                                </span>
                                {page < totalPages && (
                                    <Link href={publicationHref(filters, page + 1)} className={linkClass}>
                                        Berikutnya
                                    </Link>
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
