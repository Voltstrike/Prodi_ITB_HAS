import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { db } from "@/prisma/db";
import KegiatanCard from "./components/KegiatanCard";

export const metadata: Metadata = {
    title: "Penelitian & Pengabdian | Magister Manajemen ITB HAS",
    description:
        "Kegiatan penelitian dan pengabdian masyarakat Program Studi Magister Manajemen ITB Haji Agus Salim.",
};

export const dynamic = "force-dynamic";

const PAGE_SIZE = 9;

type Props = {
    searchParams: Promise<{
        jenis?: string | string[];
        tahun?: string | string[];
        page?: string | string[];
    }>;
};

export default async function KegiatanProdiPage({
    searchParams,
}: Props) {
    const params = await searchParams;
    const maxYear = new Date().getFullYear() + 1;

    const jenis =
        params.jenis === "PENELITIAN" || params.jenis === "PENGABDIAN"
            ? params.jenis
            : "";

    const rawTahun = typeof params.tahun === "string" ? params.tahun : "";
    const parsedTahun = /^\d{4}$/.test(rawTahun) ? Number(rawTahun) : 0;
    const tahun =
        parsedTahun >= 1900 && parsedTahun <= maxYear
            ? parsedTahun
            : undefined;

    const rawPage = typeof params.page === "string" ? params.page : "1";
    const parsedPage = /^\d+$/.test(rawPage) ? Number(rawPage) : 1;
    const requestedPage =
        Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;

    const filter = {
        ...(jenis ? { jenis } : {}),
        ...(tahun !== undefined ? { tahun } : {}),
    };

    const { total } = await db.orm.public.KegiatanProdi
        .where(filter)
        .aggregate((a) => ({ total: a.count() }));

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const currentPage = Math.min(requestedPage, totalPages);

    const kegiatan = await db.orm.public.KegiatanProdi
        .where(filter)
        .include("dosen")
        .orderBy([(item) => item.tahun.desc(), (item) => item.id.desc()])
        .offset((currentPage - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .all();

    function pageHref(page: number) {
        const query = new URLSearchParams();

        if (jenis) query.set("jenis", jenis);
        if (tahun !== undefined) query.set("tahun", String(tahun));
        if (page > 1) query.set("page", String(page));

        const search = query.toString();
        return `/kegiatan-prodi${search ? `?${search}` : ""}`;
    }

    const inputClass =
        "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900";

    const pageLinkClass =
        "rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50";

    return (
        <>
            <Navbar />

            <main className="flex-1 bg-slate-50">
                <section className="border-b border-slate-200 bg-white px-6 py-12 md:py-16">
                    <div className="mx-auto max-w-6xl">
                        <nav
                            aria-label="Breadcrumb"
                            className="mb-6 text-sm text-slate-500"
                        >
                            <Link href="/" className="hover:text-blue-700">
                                Beranda
                            </Link>
                            <span aria-hidden="true" className="mx-3">/</span>
                            <span aria-current="page">
                                Penelitian &amp; Pengabdian
                            </span>
                        </nav>

                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                            Penelitian &amp; Pengabdian
                        </h1>

                        <p className="mt-4 max-w-2xl leading-relaxed text-slate-600">
                            Kegiatan penelitian dan pengabdian masyarakat
                            Program Studi Magister Manajemen Institut
                            Teknologi dan Bisnis Haji Agus Salim.
                        </p>
                    </div>
                </section>

                <section
                    aria-labelledby="daftar-kegiatan"
                    className="px-6 py-12 md:py-16"
                >
                    <div className="mx-auto max-w-6xl">
                        <form
                            key={`${jenis}:${tahun ?? ""}`}
                            action="/kegiatan-prodi"
                            method="get"
                            className="mb-10 flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-5"
                        >
                            <label className="min-w-48 flex-1 space-y-2 text-sm text-slate-700">
                                <span className="block">Jenis Kegiatan</span>
                                <select
                                    name="jenis"
                                    defaultValue={jenis}
                                    className={inputClass}
                                >
                                    <option value="">Semua kegiatan</option>
                                    <option value="PENELITIAN">Penelitian</option>
                                    <option value="PENGABDIAN">
                                        Pengabdian Masyarakat
                                    </option>
                                </select>
                            </label>

                            <label className="min-w-48 flex-1 space-y-2 text-sm text-slate-700">
                                <span className="block">Tahun</span>
                                <input
                                    type="number"
                                    name="tahun"
                                    min={1900}
                                    max={maxYear}
                                    step={1}
                                    defaultValue={tahun ?? ""}
                                    placeholder="Semua tahun"
                                    className={inputClass}
                                />
                            </label>

                            <button
                                type="submit"
                                className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                            >
                                Terapkan
                            </button>

                            <Link
                                href="/kegiatan-prodi"
                                className="px-4 py-2 text-sm font-medium text-blue-700 hover:underline"
                            >
                                Reset
                            </Link>
                        </form>

                        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
                            <h2
                                id="daftar-kegiatan"
                                className="text-2xl font-bold text-slate-900"
                            >
                                Daftar Kegiatan
                            </h2>
                            <p className="text-sm text-slate-500">
                                {total} kegiatan
                            </p>
                        </div>

                        {kegiatan.length === 0 ? (
                            <p className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center text-slate-600">
                                Belum ada kegiatan yang dapat ditampilkan.
                            </p>
                        ) : (
                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {kegiatan.map((item) => (
                                    <KegiatanCard key={item.id} item={item} />
                                ))}
                            </div>
                        )}

                        {totalPages > 1 && (
                            <nav
                                aria-label="Halaman kegiatan"
                                className="mt-10 flex flex-wrap items-center justify-center gap-4"
                            >
                                {currentPage > 1 && (
                                    <Link
                                        href={pageHref(currentPage - 1)}
                                        className={pageLinkClass}
                                    >
                                        Sebelumnya
                                    </Link>
                                )}

                                <span className="text-sm text-slate-600">
                                    Halaman {currentPage} dari {totalPages}
                                </span>

                                {currentPage < totalPages && (
                                    <Link
                                        href={pageHref(currentPage + 1)}
                                        className={pageLinkClass}
                                    >
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
