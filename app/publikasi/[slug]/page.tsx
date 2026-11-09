import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getPublicPublicationBySlug } from "@/lib/publikasi/queries";
import {
    publicationAuthors,
    publicationDoiUrl,
} from "@/lib/publikasi/validation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Detail Publikasi | Magister Manajemen ITB HAS",
    description: "Informasi publikasi ilmiah dan tautan menuju sumber aslinya.",
};

function sourceUrl(value: string): string | null {
    if (/[\u0000-\u0020\u007f-\u009f]/.test(value)) return null;

    try {
        const url = new URL(value);
        if (
            !["http:", "https:"].includes(url.protocol) ||
            !url.hostname ||
            url.username ||
            url.password
        ) return null;

        return url.href;
    } catch {
        return null;
    }
}

export default async function PublicationDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const item = await getPublicPublicationBySlug(slug);

    if (!item) notFound();

    const originalUrl = sourceUrl(item.tautanPublikasi);
    const doiUrl = publicationDoiUrl(item.doi);

    return (
        <>
            <Navbar />

            <main className="flex-1 bg-slate-50">
                <section className="border-b border-slate-200 bg-white px-6 py-12 md:py-16">
                    <div className="mx-auto max-w-4xl">
                        <nav
                            aria-label="Breadcrumb"
                            className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-500"
                        >
                            <Link href="/" className="hover:text-blue-700">Beranda</Link>
                            <span aria-hidden="true">/</span>
                            <Link href="/publikasi" className="hover:text-blue-700">
                                Publikasi Ilmiah
                            </Link>
                            <span aria-hidden="true">/</span>
                            <span aria-current="page">Detail Publikasi</span>
                        </nav>

                        <p className="mb-3 text-sm font-semibold text-blue-700">
                            {item.jenis === "TESIS" ? "Tesis" : "Artikel ilmiah"}
                            {" · "}{item.tahun}
                        </p>
                        <h1 className="break-words text-3xl font-bold leading-tight text-slate-900 md:text-4xl">
                            {item.judul}
                        </h1>
                    </div>
                </section>

                <div className="mx-auto max-w-4xl space-y-6 px-6 py-10">
                    <article className="space-y-8 rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
                        <section aria-labelledby="publication-authors">
                            <h2 id="publication-authors" className="text-lg font-bold text-slate-900">
                                Penulis
                            </h2>
                            <ol className="mt-3 list-decimal space-y-2 pl-5 text-slate-600">
                                {publicationAuthors(item.penulis).map((author, index) => (
                                    <li key={index} className="break-words">{author}</li>
                                ))}
                            </ol>
                        </section>

                        <dl className="space-y-4 text-sm">
                            <div>
                                <dt className="font-semibold text-slate-900">Jurnal atau repositori</dt>
                                <dd className="mt-1 break-words text-slate-600">{item.sumber}</dd>
                            </div>
                            <div>
                                <dt className="font-semibold text-slate-900">Tahun publikasi</dt>
                                <dd className="mt-1 text-slate-600">{item.tahun}</dd>
                            </div>
                            {item.doi && (
                                <div>
                                    <dt className="font-semibold text-slate-900">DOI</dt>
                                    <dd className="mt-1 break-all text-slate-600">
                                        {doiUrl ? (
                                            <a
                                                href={doiUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-700 underline"
                                            >
                                                {item.doi}
                                                <span className="sr-only"> (terbuka di tab baru)</span>
                                            </a>
                                        ) : item.doi}
                                    </dd>
                                </div>
                            )}
                        </dl>

                        {item.ringkasan && (
                            <section aria-labelledby="publication-summary">
                                <h2 id="publication-summary" className="text-lg font-bold text-slate-900">
                                    Ringkasan
                                </h2>
                                <p className="mt-4 whitespace-pre-line break-words leading-relaxed text-slate-600">
                                    {item.ringkasan}
                                </p>
                            </section>
                        )}

                        {originalUrl && (
                            <div className="border-t border-slate-100 pt-6">
                                <a
                                    href={originalUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800"
                                >
                                    Buka Publikasi Asli ↗
                                    <span className="sr-only"> (terbuka di tab baru)</span>
                                </a>
                                <p className="mt-3 text-xs text-slate-500">
                                    Ketersediaan naskah lengkap mengikuti ketentuan
                                    jurnal atau repositori sumber.
                                </p>
                            </div>
                        )}
                    </article>

                    <Link
                        href="/publikasi"
                        className="inline-flex text-sm font-semibold text-blue-700 hover:underline"
                    >
                        ← Kembali ke Daftar Publikasi
                    </Link>
                </div>
            </main>

            <Footer />
        </>
    );
}
