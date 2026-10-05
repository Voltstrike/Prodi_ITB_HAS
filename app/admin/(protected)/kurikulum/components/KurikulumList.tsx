"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Kurikulum = {
    id: number;
    kode: string;
    nama: string;
    sks: number;
    semester: number;
    jenis: string;
};

export default function KurikulumList({
    kurikulum,
}: {
    kurikulum: Kurikulum[];
}) {
    const [search, setSearch] = useState("");
    const [semester, setSemester] = useState("Semua");

    const semesterOptions = useMemo(
        () =>
            Array.from(
                new Set(kurikulum.map((item) => item.semester)),
            ).sort((a, b) => a - b),
        [kurikulum],
    );

    const filteredKurikulum = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return kurikulum.filter((item) => {
            const matchesSearch =
                !keyword ||
                item.kode.toLowerCase().includes(keyword) ||
                item.nama.toLowerCase().includes(keyword) ||
                item.jenis.toLowerCase().includes(keyword);

            const matchesSemester =
                semester === "Semua" ||
                item.semester === Number(semester);

            return matchesSearch && matchesSemester;
        });
    }, [kurikulum, search, semester]);

    return (
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="font-semibold text-slate-900">
                            Daftar Mata Kuliah
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {filteredKurikulum.length} dari{" "}
                            {kurikulum.length} mata kuliah.
                        </p>
                    </div>

                    <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
                        <input
                            type="search"
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            placeholder="Cari kode, nama, atau jenis..."
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-72"
                        />

                        <select
                            value={semester}
                            onChange={(event) =>
                                setSemester(event.target.value)
                            }
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="Semua">Semua Semester</option>
                            {semesterOptions.map((item) => (
                                <option key={item} value={item}>
                                    Semester {item}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {filteredKurikulum.length === 0 ? (
                <div className="px-6 py-12 text-center">
                    <p className="text-sm text-slate-500">
                        Tidak ada mata kuliah yang sesuai dengan pencarian.
                    </p>
                </div>
            ) : (
                <div className="divide-y divide-slate-100">
                    {filteredKurikulum.map((item) => (
                        <article
                            key={item.id}
                            className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                        >
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                                        {item.kode}
                                    </span>

                                    <span
                                        className={`rounded-md px-2 py-1 text-xs font-medium ${
                                            item.jenis === "Wajib"
                                                ? "bg-blue-50 text-blue-700"
                                                : "bg-amber-50 text-amber-700"
                                        }`}
                                    >
                                        {item.jenis}
                                    </span>
                                </div>

                                <h3 className="mt-2 font-semibold text-slate-900">
                                    {item.nama}
                                </h3>

                                <p className="mt-1 text-sm text-slate-500">
                                    Semester {item.semester} · {item.sks} SKS
                                </p>
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                                <Link
                                    href={`/admin/kurikulum/${item.id}`}
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                    Edit
                                </Link>

                                <button
                                    type="button"
                                    onClick={async () => {
                                        const confirmed = window.confirm(
                                            `Hapus mata kuliah ${item.kode} - ${item.nama}?`,
                                        );

                                        if (!confirmed) return;

                                        const response = await fetch(
                                            `/api/kurikulum/${item.id}`,
                                            {
                                                method: "DELETE",
                                            },
                                        );

                                        if (!response.ok) {
                                            const error =
                                                await response.json();

                                            alert(
                                                error.message ??
                                                    "Gagal menghapus kurikulum",
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
