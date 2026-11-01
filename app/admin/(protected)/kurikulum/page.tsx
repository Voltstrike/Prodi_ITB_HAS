import { db } from "@/prisma/db";
import Link from "next/link";
import KurikulumList from "./components/KurikulumList";
import DokumenKurikulumForm from "@/components/admin/DokumenKurikulumForm";
import { toDokumenKurikulumDto } from "@/lib/http/dto";

export const dynamic = "force-dynamic";

export default async function AdminKurikulumPage() {
    const [kurikulum, dokumen] = await Promise.all([
        db.orm.public.Kurikulum.all(),
        db.orm.public.DokumenKurikulum
            .orderBy([
                (item) => item.createdAt.desc(),
                (item) => item.id.desc(),
            ])
            .all(),
    ]);

    const daftarDokumen = dokumen.map(toDokumenKurikulumDto);

    return (
        <div className="space-y-8 pb-24 sm:pb-0">
            <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Kurikulum
                    </h1>
                    <p className="mt-1 text-sm text-slate-600">
                        Kelola mata kuliah dan dokumen kurikulum Program
                        Studi Magister Manajemen.
                    </p>
                </div>

                <Link
                    href="/admin/kurikulum/tambah"
                    className="hidden items-center justify-center rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-800 sm:inline-flex"
                >
                    Tambah Mata Kuliah
                </Link>
            </section>

            <KurikulumList kurikulum={kurikulum} />

            <section
                id="dokumen-kurikulum"
                aria-labelledby="judul-dokumen-kurikulum"
                className="scroll-mt-6 space-y-6 border-t border-slate-200 pt-8"
            >
                <h2
                    id="judul-dokumen-kurikulum"
                    className="text-xl font-bold text-slate-900"
                >
                    Dokumen Kurikulum
                </h2>

                <DokumenKurikulumForm />

                <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="font-semibold text-slate-900">
                            Dokumen Tersimpan
                        </h3>

                        <p className="text-sm text-slate-500">
                            {daftarDokumen.length} dokumen
                        </p>
                    </div>

                    {daftarDokumen.length === 0 ? (
                        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                            Belum ada dokumen. Unggah PDF menggunakan
                            form di atas.
                        </div>
                    ) : (
                        <ul className="space-y-4">
                            {daftarDokumen.map((item) => (
                                <li
                                    key={item.id}
                                    className="rounded-xl border border-slate-200 bg-white p-6"
                                >
                                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="min-w-0">
                                            <h4 className="break-words font-semibold text-slate-900">
                                                {item.judul}
                                            </h4>

                                            <p className="mt-2 break-all text-sm text-slate-600">
                                                {item.namaAsli}
                                            </p>

                                            <p className="mt-1 text-xs text-slate-500">
                                                PDF · {Math.ceil(item.ukuran / 1024)} KB
                                            </p>
                                        </div>

                                        <div className="flex shrink-0 flex-wrap gap-3">
                                            <a
                                                href={item.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
                                            >
                                                Buka PDF
                                            </a>

                                            <a
                                                href={`${item.url}?download=1`}
                                                className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
                                            >
                                                Download PDF
                                            </a>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </section>

            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-4px_16px_rgba(15,23,42,0.08)] backdrop-blur sm:hidden">
                <Link
                    href="/admin/kurikulum/tambah"
                    className="mx-auto flex w-full max-w-4xl items-center justify-center rounded-lg bg-blue-700 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-800"
                >
                    Tambah Mata Kuliah
                </Link>
            </div>
        </div>
    );
}