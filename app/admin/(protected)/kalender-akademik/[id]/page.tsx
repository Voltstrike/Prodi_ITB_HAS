"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type KalenderAkademik = {
    id: number;
    kegiatan: string;
    tanggalMulai: string;
    tanggalSelesai: string;
};

export default function EditKalenderAkademikPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const [id, setId] = useState("");
    const [kegiatan, setKegiatan] = useState("");
    const [tanggalMulai, setTanggalMulai] = useState("");
    const [tanggalSelesai, setTanggalSelesai] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function loadData() {
            const { id: paramId } = await params;
            setId(paramId);

            try {
                const response = await fetch(
                    `/api/kalender-akademik/${paramId}`,
                );

                const data: KalenderAkademik = await response.json();

                if (!response.ok) {
                    alert(
                        (data as unknown as { message?: string }).message ??
                            "Gagal memuat kegiatan.",
                    );
                    return;
                }

                setKegiatan(data.kegiatan);
                setTanggalMulai(data.tanggalMulai);
                setTanggalSelesai(data.tanggalSelesai);
            } catch {
                alert("Terjadi kesalahan saat memuat kegiatan.");
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [params]);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!kegiatan.trim() || !tanggalMulai || !tanggalSelesai) {
            alert("Semua field wajib diisi.");
            return;
        }

        if (tanggalSelesai < tanggalMulai) {
            alert("Tanggal selesai tidak boleh sebelum tanggal mulai.");
            return;
        }

        setSaving(true);

        try {
            const response = await fetch(`/api/kalender-akademik/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    kegiatan: kegiatan.trim(),
                    tanggalMulai,
                    tanggalSelesai,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message ?? "Gagal menyimpan perubahan.");
                return;
            }

            window.location.href = "/admin/kalender-akademik";
        } catch {
            alert("Terjadi kesalahan saat menyimpan perubahan.");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="space-y-8">
                <section>
                    <div className="h-4 w-48 animate-pulse rounded bg-slate-200" />
                    <div className="mt-4 h-8 w-56 animate-pulse rounded bg-slate-200" />
                    <div className="mt-2 h-4 w-80 animate-pulse rounded bg-slate-200" />
                </section>

                <div className="h-80 animate-pulse rounded-xl bg-slate-200" />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-24 sm:pb-0">
            <section>
                <Link
                    href="/admin/kalender-akademik"
                    className="text-sm font-medium text-blue-700 hover:text-blue-800"
                >
                    ← Kembali ke Kalender Akademik
                </Link>

                <h1 className="mt-4 text-2xl font-bold text-slate-900">
                    Edit Kegiatan
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                    Perbarui informasi kegiatan akademik.
                </p>
            </section>

            <form onSubmit={handleSubmit} className="space-y-6">
                <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-6 py-4">
                        <h2 className="font-semibold text-slate-900">
                            Informasi Kegiatan
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Perbarui nama dan periode kegiatan.
                        </p>
                    </div>

                    <div className="grid gap-5 px-6 py-6">
                        <div>
                            <label
                                htmlFor="kegiatan"
                                className="mb-2 block text-sm font-medium text-slate-700"
                            >
                                Nama Kegiatan
                            </label>
                            <input
                                id="kegiatan"
                                type="text"
                                value={kegiatan}
                                onChange={(event) =>
                                    setKegiatan(event.target.value)
                                }
                                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="tanggalMulai"
                                    className="mb-2 block text-sm font-medium text-slate-700"
                                >
                                    Tanggal Mulai
                                </label>
                                <input
                                    id="tanggalMulai"
                                    type="date"
                                    value={tanggalMulai}
                                    onChange={(event) =>
                                        setTanggalMulai(event.target.value)
                                    }
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="tanggalSelesai"
                                    className="mb-2 block text-sm font-medium text-slate-700"
                                >
                                    Tanggal Selesai
                                </label>
                                <input
                                    id="tanggalSelesai"
                                    type="date"
                                    value={tanggalSelesai}
                                    onChange={(event) =>
                                        setTanggalSelesai(event.target.value)
                                    }
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                <div className="hidden justify-end gap-3 sm:flex">
                    <Link
                        href="/admin/kalender-akademik"
                        className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                        Batal
                    </Link>

                    <button
                        type="submit"
                        disabled={saving}
                        className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {saving ? "Menyimpan..." : "Simpan Perubahan"}
                    </button>
                </div>

                <div className="fixed inset-x-0 bottom-0 z-30 flex gap-3 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-4px_16px_rgba(15,23,42,0.08)] backdrop-blur sm:hidden">
                    <Link
                        href="/admin/kalender-akademik"
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