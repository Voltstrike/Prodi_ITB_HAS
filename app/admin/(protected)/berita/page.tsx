import Link from "next/link";
import { db } from "@/prisma/db";
import HapusBeritaButton from "./components/HapusBeritaButton";

export default async function AdminBeritaPage() {
    const berita = await db.orm.public.Berita.all();

    return (
        <main className="min-h-screen bg-slate-50">
            <section className="border-b border-slate-200 bg-white">
                <div className="mx-auto max-w-6xl px-6 py-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                Berita
                            </h1>
                            <p className="mt-1 text-sm text-slate-600">
                                Kelola berita dan informasi Program Studi.
                            </p>
                        </div>

                        <Link
                            href="/admin/berita/tambah"
                            className="inline-flex w-fit rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                        >
                            + Tambah Berita
                        </Link>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-6xl px-6 py-8">
                {berita.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
                        Belum ada berita.
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-slate-200 bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold text-slate-700">
                                            Judul
                                        </th>
                                        <th className="px-4 py-3 font-semibold text-slate-700">
                                            Tanggal
                                        </th>
                                        <th className="px-4 py-3 font-semibold text-slate-700">
                                            Slug
                                        </th>
                                        <th className="px-4 py-3 font-semibold text-slate-700">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {berita.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="border-b border-slate-100 last:border-0"
                                        >
                                            <td className="px-4 py-4 font-medium text-slate-900">
                                                {item.title}
                                            </td>

                                            <td className="px-4 py-4 text-slate-600">
                                                {item.date}
                                            </td>

                                            <td className="px-4 py-4 text-slate-500">
                                                {item.slug}
                                            </td>

                                            <td className="px-4 py-4">
                                                <div className="flex flex-wrap gap-2">
                                                    <Link
                                                        href={`/admin/berita/${item.slug}`}
                                                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                                    >
                                                        Edit
                                                    </Link>

                                                    <HapusBeritaButton
                                                        slug={item.slug}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}