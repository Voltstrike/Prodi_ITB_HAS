import { listingMetadata } from "@/lib/seo";
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

export async function generateMetadata({ searchParams }: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
    return listingMetadata("/publikasi", "Publikasi Ilmiah Magister Manajemen ITB HAS",
        "Telusuri tesis dan artikel ilmiah beserta penulis, tahun terbit, dan tautan ke sumber publikasinya.", await searchParams);
}

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
                            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                                <table aria-labelledby="publication-list" className="w-full table-fixed text-left">
                                    <thead className="bg-slate-100 text-sm text-slate-700">
                                        <tr>
                                            <th scope="col" className="px-4 py-3 font-semibold md:w-[53%] md:px-6">Judul publikasi</th>
                                            <th scope="col" className="hidden px-3 py-3 font-semibold md:table-cell md:w-[23%]">Penulis</th>
                                            <th scope="col" className="hidden px-3 py-3 font-semibold md:table-cell md:w-[15%]">Jenis</th>
                                            <th scope="col" className="w-[4.5rem] px-2 py-3 text-right font-semibold md:w-[9%] md:pr-6">Tahun</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {publications.map((item) => {
                                            const authors = publicationAuthors(item.penulis).join("; ");
                                            const isThesis = item.jenis === "TESIS";
                                            const kind = isThesis ? "Tesis" : "Artikel ilmiah";
                                            return (
                                                <tr key={item.id} className="border-t border-slate-200 align-top hover:bg-slate-50 focus-within:bg-blue-50">
                                                    <td className="break-words px-4 py-4 md:px-6">
                                                        <Link
                                                            href={`/publikasi/${encodeURIComponent(item.slug)}`}
                                                            className="rounded-sm font-semibold leading-snug text-blue-800 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                                                        >
                                                            {item.judul}
                                                        </Link>
                                                        <p className="mt-1 hidden text-sm leading-snug text-slate-600 md:block">
                                                            {item.sumber}
                                                        </p>
                                                        <p className="mt-1 text-sm text-slate-600 md:hidden">
                                                            {authors && `${authors} · `}{kind}
                                                        </p>
                                                    </td>
                                                    <td className="hidden break-words px-3 py-4 text-sm text-slate-700 md:table-cell">
                                                        {authors}
                                                    </td>
                                                    <td className="hidden px-3 py-4 md:table-cell">
                                                        <span className={`inline-block rounded-md px-2 py-1 text-xs font-medium ${isThesis ? "bg-violet-50 text-violet-800" : "bg-blue-50 text-blue-800"}`}>
                                                            {kind}
                                                        </span>
                                                    </td>
                                                    <td className="px-2 py-4 text-right text-sm tabular-nums text-slate-700 md:pr-6">
                                                        {item.tahun}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
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
