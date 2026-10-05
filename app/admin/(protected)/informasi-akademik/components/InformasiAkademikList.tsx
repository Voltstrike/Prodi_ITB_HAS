"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type InformasiAkademik = {
    id: number;
    judul: string;
    deskripsi: string;
};

export default function InformasiAkademikList({
    informasi,
}: {
    informasi: InformasiAkademik[];
}) {
    const [search, setSearch] = useState("");

    const filteredInformasi = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return informasi.filter(
            (item) =>
                !keyword ||
                item.judul.toLowerCase().includes(keyword) ||
                item.deskripsi.toLowerCase().includes(keyword),
        );
    }, [informasi, search]);

    return (
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="font-semibold text-slate-900">
                            Informasi Akademik
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {filteredInformasi.length} dari{" "}
                            {informasi.length} informasi.
                        </p>
                    </div>

                    <div className="w-full sm:w-72">
                        <input
                            type="search"
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            placeholder="Cari informasi..."
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                </div>
            </div>

            {filteredInformasi.length === 0 ? (
                <div className="px-6 py-12 text-center">
                    <p className="text-sm text-slate-500">
                        Tidak ada informasi yang sesuai dengan pencarian.
                    </p>
                </div>
            ) : (
                <div className="divide-y divide-slate-100">
                    {filteredInformasi.map((item) => (
                        <article
                            key={item.id}
                            className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-start sm:justify-between"
                        >
                            <div className="min-w-0">
                                <h3 className="font-semibold text-slate-900">
                                    {item.judul}
                                </h3>

                                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                                    {item.deskripsi}
                                </p>
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                                <Link
                                    href={`/admin/informasi-akademik/${item.id}`}
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                    Edit
                                </Link>

                                <button
                                    type="button"
                                    onClick={async () => {
                                        const confirmed = window.confirm(
                                            `Hapus informasi "${item.judul}"?`,
                                        );

                                        if (!confirmed) return;

                                        const response = await fetch(
                                            `/api/informasi-akademik/${item.id}`,
                                            {
                                                method: "DELETE",
                                            },
                                        );

                                        if (!response.ok) {
                                            const error =
                                                await response.json();

                                            alert(
                                                error.message ??
                                                    "Gagal menghapus informasi akademik",
                                            );
                                            return;
                                        }

                                        window.location.reload();
                                    }}
                                    className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                                >
                                    Hapus
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}
