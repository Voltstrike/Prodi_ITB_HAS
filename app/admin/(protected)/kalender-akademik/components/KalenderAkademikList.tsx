"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type KalenderAkademik = {
    id: number;
    kegiatan: string;
    tanggalMulai: string;
    tanggalSelesai: string;
};
    
function formatTanggal(tanggal: string) {
    const date = new Date(`${tanggal}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return tanggal;
    }

    return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(date);
}

export default function KalenderAkademikList({
    kalender,
}: {
    kalender: KalenderAkademik[];
}) {
    const [search, setSearch] = useState("");

    const filteredKalender = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return [...kalender]
            .sort((a, b) =>
                a.tanggalMulai.localeCompare(b.tanggalMulai),
            )
            .filter(
                (item) =>
                    !keyword ||
                    item.kegiatan.toLowerCase().includes(keyword),
            );
    }, [kalender, search]);

    return (
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="font-semibold text-slate-900">
                            Kalender Akademik
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {filteredKalender.length} dari {kalender.length}{" "}
                            kegiatan.
                        </p>
                    </div>

                    <div className="w-full sm:w-72">
                        <input
                            type="search"
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            placeholder="Cari kegiatan..."
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                </div>
            </div>

            {filteredKalender.length === 0 ? (
                <div className="px-6 py-12 text-center">
                    <p className="text-sm text-slate-500">
                        Tidak ada kegiatan yang sesuai dengan pencarian.
                    </p>
                </div>
            ) : (
                <div className="divide-y divide-slate-100">
                    {filteredKalender.map((item) => (
                        <article
                            key={item.id}
                            className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                        >
                            <div className="min-w-0">
                                <h3 className="font-semibold text-slate-900">
                                    {item.kegiatan}
                                </h3>

                                <p className="mt-2 text-sm text-slate-600">
                                    {formatTanggal(item.tanggalMulai)}
                                    {" — "}
                                    {formatTanggal(item.tanggalSelesai)}
                                </p>
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                                <Link
                                    href={`/admin/kalender-akademik/${item.id}`}
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                    Edit
                                </Link>

                                <button
                                    type="button"
                                    onClick={async () => {
                                        const confirmed = window.confirm(
                                            `Hapus kegiatan "${item.kegiatan}"?`,
                                        );

                                        if (!confirmed) return;

                                        const response = await fetch(
                                            `/api/kalender-akademik/${item.id}`,
                                            {
                                                method: "DELETE",
                                            },
                                        );

                                        if (!response.ok) {
                                            const error =
                                                await response.json();

                                            alert(
                                                error.message ??
                                                    "Gagal menghapus kalender akademik",
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
