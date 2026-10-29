import Link from "next/link";
import { db } from "@/prisma/db";

export default async function AdminKegiatanProdiPage() {
    const kegiatan = await db.orm.public.KegiatanProdi
        .include("dosen")
        .all();

    const sorted = [...kegiatan].sort(
        (a, b) => b.tahun - a.tahun || b.id - a.id
    );

    return (
        <main className="min-h-screen bg-slate-50">
            <section className="border-b border-slate-200 bg-white">
                <div className="mx-auto max-w-6xl px-6 py-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                Kegiatan Prodi
                            </h1>
                            <p className="mt-1 text-sm text-slate-600">
                                Kelola kegiatan penelitian dan pengabdian masyarakat.
                            </p>
                        </div>

                        <Link
                            href="/admin/kegiatan-prodi/tambah"
                            className="inline-flex w-fit rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                        >
                            + Tambah Kegiatan
                        </Link>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-6xl px-6 py-8">
                {sorted.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
                        Belum ada kegiatan penelitian atau pengabdian.
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-slate-200 bg-slate-50">
                                    <tr>
                                        {["Judul", "Jenis", "Tahun", "Dosen", "Aksi"].map((label) => (
                                            <th key={label} className="px-4 py-3 font-semibold text-slate-700">
                                                {label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {sorted.map((item) => (
                                        <tr key={item.id} className="border-b border-slate-100 last:border-0">
                                            <td className="px-4 py-4 font-medium text-slate-900">
                                                {item.judul}
                                            </td>
                                            <td className="px-4 py-4 text-slate-600">
                                                {item.jenis === "PENELITIAN" ? "Penelitian" : "Pengabdian"}
                                            </td>
                                            <td className="px-4 py-4 text-slate-600">
                                                {item.tahun}
                                            </td>
                                            <td className="px-4 py-4 text-slate-600">
                                                {item.dosen.nama}
                                            </td>
                                            <td className="px-4 py-4">
                                                <Link
                                                    href={`/admin/kegiatan-prodi/${item.slug}`}
                                                    className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                                >
                                                    Edit
                                                </Link>
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
