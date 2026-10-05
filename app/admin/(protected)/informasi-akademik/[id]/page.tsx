"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type InformasiAkademik = {
    id: number;
    judul: string;
    deskripsi: string;
};

export default function EditInformasiAkademikPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const [id, setId] = useState("");
    const [judul, setJudul] = useState("");
    const [deskripsi, setDeskripsi] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function loadData() {
            const { id: paramId } = await params;
            setId(paramId);

            try {
                const response = await fetch(
                    `/api/informasi-akademik/${paramId}`,
                );

                const data = await response.json();

                if (!response.ok) {
                    alert(
                        data.message ??
                            "Gagal memuat informasi akademik.",
                    );
                    return;
                }

                const informasi = data as InformasiAkademik;

                setJudul(informasi.judul);
                setDeskripsi(informasi.deskripsi);
            } catch {
                alert(
                    "Terjadi kesalahan saat memuat informasi akademik.",
                );
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [params]);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!judul.trim() || !deskripsi.trim()) {
            alert("Judul dan deskripsi wajib diisi.");
            return;
        }

        setSaving(true);

        try {
            const response = await fetch(
                `/api/informasi-akademik/${id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        judul: judul.trim(),
                        deskripsi: deskripsi.trim(),
                    }),
                },
            );

            const data = await response.json();

            if (!response.ok) {
                alert(
                    data.message ??
                        "Gagal menyimpan perubahan.",
                );
                return;
            }

            window.location.href = "/admin/informasi-akademik";
        } catch {
            alert(
                "Terjadi kesalahan saat menyimpan perubahan.",
            );
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="space-y-8">
                <section>
                    <div className="h-4 w-56 animate-pulse rounded bg-slate-200" />
                    <div className="mt-4 h-8 w-52 animate-pulse rounded bg-slate-200" />
                    <div className="mt-2 h-4 w-80 animate-pulse rounded bg-slate-200" />
                </section>

                <div className="h-96 animate-pulse rounded-xl bg-slate-200" />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-24 sm:pb-0">
            <section>
                <Link
                    href="/admin/informasi-akademik"
                    className="text-sm font-medium text-blue-700 hover:text-blue-800"
                >
                    ← Kembali ke Informasi Akademik
                </Link>

                <h1 className="mt-4 text-2xl font-bold text-slate-900">
                    Edit Informasi
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                    Perbarui informasi akademik.
                </p>
            </section>

            <form onSubmit={handleSubmit} className="space-y-6">
                <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-6 py-4">
                        <h2 className="font-semibold text-slate-900">
                            Informasi Akademik
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Perbarui judul dan isi informasi.
                        </p>
                    </div>

                    <div className="grid gap-5 px-6 py-6">
                        <div>
                            <label
                                htmlFor="judul"
                                className="mb-2 block text-sm font-medium text-slate-700"
                            >
                                Judul
                            </label>
                            <input
                                id="judul"
                                type="text"
                                value={judul}
                                onChange={(event) =>
                                    setJudul(event.target.value)
                                }
                                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="deskripsi"
                                className="mb-2 block text-sm font-medium text-slate-700"
                            >
                                Deskripsi
                            </label>
                            <textarea
                                id="deskripsi"
                                value={deskripsi}
                                onChange={(event) =>
                                    setDeskripsi(event.target.value)
                                }
                                rows={10}
                                className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2.5 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>
                    </div>
                </section>

                <div className="hidden justify-end gap-3 sm:flex">
                    <Link
                        href="/admin/informasi-akademik"
                        className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                        Batal
                    </Link>

                    <button
                        type="submit"
                        disabled={saving}
                        className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {saving
                            ? "Menyimpan..."
                            : "Simpan Perubahan"}
                    </button>
                </div>

                <div className="fixed inset-x-0 bottom-0 z-30 flex gap-3 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-4px_16px_rgba(15,23,42,0.08)] backdrop-blur sm:hidden">
                    <Link
                        href="/admin/informasi-akademik"
                        className="flex flex-1 items-center justify-center rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700"
                    >
                        Batal
                    </Link>

                    <button
                        type="submit"
                        disabled={saving}
                        className="flex flex-1 items-center justify-center rounded-lg bg-blue-700 px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {saving ? "Menyimpan..." : "Simpan"}
                    </button>
                </div>
            </form>
        </div>
    );
}
