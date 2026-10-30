import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ImageWithFallback from "@/components/ImageWithFallback";
import { db } from "@/prisma/db";

export const metadata: Metadata = {
    title: "Detail Kegiatan | Magister Manajemen ITB HAS",
    description:
        "Informasi kegiatan penelitian dan pengabdian masyarakat Program Studi Magister Manajemen ITB Haji Agus Salim.",
};

export const dynamic = "force-dynamic";

type Props = {
    params: Promise<{ slug: string }>;
};

export default async function KegiatanDetailPage({ params }: Props) {
    const { slug } = await params;

    const item = await db.orm.public.KegiatanProdi
        .where({ slug })
        .include("dosen")
        .first();

    if (!item) {
        notFound();
    }

    const jenis = item.jenis === "PENELITIAN"
        ? "Penelitian"
        : "Pengabdian Masyarakat";

    let tautanHasil: string | null = null;

    if (item.tautanHasil) {
        try {
            const url = new URL(item.tautanHasil);

            if (
                (url.protocol === "http:" || url.protocol === "https:") &&
                !url.username &&
                !url.password
            ) {
                tautanHasil = url.href;
            }
        } catch {
            tautanHasil = null;
        }
    }

    return (
        <>
            <Navbar />

            <main className="flex-1 bg-slate-50">
                <section className="border-b border-slate-200 bg-white px-6 py-12 md:py-16">
                    <div className="mx-auto max-w-6xl">
                        <nav
                            aria-label="Breadcrumb"
                            className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-500"
                        >
                            <Link href="/" className="hover:text-blue-700">
                                Beranda
                            </Link>

                            <span aria-hidden="true">/</span>

                            <Link
                                href="/kegiatan-prodi"
                                className="hover:text-blue-700"
                            >
                                Penelitian &amp; Pengabdian
                            </Link>

                            <span aria-hidden="true">/</span>

                            <span aria-current="page">
                                Detail Kegiatan
                            </span>
                        </nav>

                        <p className="mb-2 text-sm font-semibold text-blue-700">
                            {jenis}
                        </p>

                        <h1 className="break-words text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                            {item.judul}
                        </h1>

                        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
                            <p>Tahun: {item.tahun}</p>
                            <p>
                                Dosen:{" "}
                                <Link
                                    href={`/dosen/${encodeURIComponent(item.dosen.slug)}`}
                                    className="font-medium text-blue-700 hover:underline"
                                >
                                    {item.dosen.nama}
                                </Link>
                            </p>
                        </div>
                    </div>
                </section>

                <div className="mx-auto max-w-4xl space-y-6 px-6 py-10 md:py-12">
                    <article className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
                        {item.foto?.trim() && (
                            <div className="relative mb-8 aspect-video overflow-hidden rounded-lg bg-blue-50">
                                <ImageWithFallback
                                    src={item.foto}
                                    alt={item.judul}
                                    fallback={
                                        <div className="flex h-full items-center justify-center text-sm font-semibold text-blue-800">
                                            MM ITB HAS
                                        </div>
                                    }
                                    fill
                                    unoptimized
                                    sizes="(max-width: 895px) 100vw, 800px"
                                    className="object-cover"
                                />
                            </div>
                        )}

                        <h2 className="text-xl font-bold text-slate-900">
                            Ringkasan
                        </h2>
                        <p className="mt-4 whitespace-pre-line break-words leading-relaxed text-slate-600">
                            {item.ringkasan}
                        </p>

                        <h2 className="mt-8 text-xl font-bold text-slate-900">
                            Uraian Kegiatan
                        </h2>
                        <p className="mt-4 whitespace-pre-line break-words leading-relaxed text-slate-600">
                            {item.uraian}
                        </p>

                        {tautanHasil && (
                            <a
                                href={tautanHasil}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-8 inline-flex rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
                            >
                                Lihat Hasil (tab baru)
                            </a>
                        )}
                    </article>

                    <Link
                        href="/kegiatan-prodi"
                        className="inline-flex text-sm font-semibold text-blue-700 hover:underline"
                    >
                        ← Kembali ke Daftar Kegiatan
                    </Link>
                </div>
            </main>

            <Footer />
        </>
    );
}
