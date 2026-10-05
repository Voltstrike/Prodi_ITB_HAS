"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

interface Dosen {
    id: number;
    slug: string;
    nama: string;
    nidn: string;
    foto: string | null;
    pendidikanS1: string | null;
    pendidikanS2: string | null;
    pendidikanS3: string | null;
    profil: string | null;
}

export default function EditDosenPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const [dosen, setDosen] = useState<Dosen | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function loadDosen() {
            const { id } = await params;

            const response = await fetch("/api/dosen");

            if (!response.ok) {
                setLoading(false);
                return;
            }

            const data: Dosen[] = await response.json();
            const item = data.find((d) => d.id === Number(id));

            setDosen(item ?? null);
            setLoading(false);
        }

        loadDosen();
    }, [params]);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!dosen || saving) {
            return;
        }

        setSaving(true);

        const form = new FormData(event.currentTarget);

        const nama = form.get("nama")?.toString() ?? "";
        const nidn = form.get("nidn")?.toString() ?? "";
        const foto = form.get("foto")?.toString() ?? "";
        const pendidikanS1 =
            form.get("pendidikanS1")?.toString() ?? "";
        const pendidikanS2 =
            form.get("pendidikanS2")?.toString() ?? "";
        const pendidikanS3 =
            form.get("pendidikanS3")?.toString() ?? "";
        const profil = form.get("profil")?.toString() ?? "";

        const response = await fetch(`/api/dosen/${dosen.slug}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                nama,
                nidn,
                foto,
                pendidikanS1,
                pendidikanS2,
                pendidikanS3,
                profil,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            alert(error.message ?? "Gagal mengubah data dosen");
            setSaving(false);
            return;
        }

        alert("Data dosen berhasil diubah");
        window.location.href = "/admin/dosen";
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <div className="h-4 w-36 animate-pulse rounded bg-slate-200" />
                    <div className="mt-4 h-8 w-48 animate-pulse rounded bg-slate-200" />
                    <div className="mt-2 h-4 w-80 animate-pulse rounded bg-slate-200" />
                </div>
            </div>
        );
    }

    if (!dosen) {
        return (
            <div className="space-y-4">
                <Link
                    href="/admin/dosen"
                    className="inline-flex items-center text-sm font-medium text-blue-700 hover:text-blue-800"
                >
                    ← Kembali ke Data Dosen
                </Link>

                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <h1 className="font-semibold text-slate-900">
                        Data dosen tidak ditemukan
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Data yang ingin diedit tidak tersedia.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl space-y-8">
            <section>
                <Link
                    href="/admin/dosen"
                    className="inline-flex items-center text-sm font-medium text-blue-700 hover:text-blue-800"
                >
                    ← Kembali ke Data Dosen
                </Link>

                <div className="mt-4">
                    <h1 className="text-2xl font-bold text-slate-900">
                        Edit Dosen
                    </h1>
                    <p className="mt-1 text-sm text-slate-600">
                        Perbarui informasi dosen Program Studi Magister
                        Manajemen.
                    </p>
                </div>
            </section>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Informasi Dasar */}
                <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-6 py-5">
                        <h2 className="font-semibold text-slate-900">
                            Informasi Dasar
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Informasi utama dosen.
                        </p>
                    </div>

                    <div className="grid gap-5 p-6 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <label
                                htmlFor="nama"
                                className="block text-sm font-medium text-slate-700"
                            >
                                Nama Lengkap
                            </label>
                            <input
                                id="nama"
                                name="nama"
                                defaultValue={dosen.nama}
                                required
                                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="nidn"
                                className="block text-sm font-medium text-slate-700"
                            >
                                NIDN
                            </label>
                            <input
                                id="nidn"
                                name="nidn"
                                defaultValue={dosen.nidn}
                                required
                                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>
                    </div>
                </section>

                {/* Pendidikan */}
                <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-6 py-5">
                        <h2 className="font-semibold text-slate-900">
                            Pendidikan
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Riwayat pendidikan akademik dosen.
                        </p>
                    </div>

                    <div className="grid gap-5 p-6 sm:grid-cols-2">
                        <div>
                            <label
                                htmlFor="pendidikanS1"
                                className="block text-sm font-medium text-slate-700"
                            >
                                Pendidikan S1
                            </label>
                            <input
                                id="pendidikanS1"
                                name="pendidikanS1"
                                defaultValue={dosen.pendidikanS1 ?? ""}
                                placeholder="Nama perguruan tinggi"
                                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="pendidikanS2"
                                className="block text-sm font-medium text-slate-700"
                            >
                                Pendidikan S2
                            </label>
                            <input
                                id="pendidikanS2"
                                name="pendidikanS2"
                                defaultValue={dosen.pendidikanS2 ?? ""}
                                placeholder="Nama perguruan tinggi"
                                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label
                                htmlFor="pendidikanS3"
                                className="block text-sm font-medium text-slate-700"
                            >
                                Pendidikan S3
                            </label>
                            <input
                                id="pendidikanS3"
                                name="pendidikanS3"
                                defaultValue={dosen.pendidikanS3 ?? ""}
                                placeholder="Nama perguruan tinggi"
                                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>
                    </div>
                </section>

                {/* Profil */}
                <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-6 py-5">
                        <h2 className="font-semibold text-slate-900">
                            Profil
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Informasi tambahan yang ditampilkan pada profil
                            dosen.
                        </p>
                    </div>

                    <div className="space-y-5 p-6">
                        <div>
                            <label
                                htmlFor="foto"
                                className="block text-sm font-medium text-slate-700"
                            >
                                URL Foto
                            </label>
                            <input
                                id="foto"
                                name="foto"
                                defaultValue={dosen.foto ?? ""}
                                placeholder="https://..."
                                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                            <p className="mt-2 text-xs text-slate-500">
                                Upload foto akan kita tambahkan setelah
                                storage hosting ditentukan.
                            </p>
                        </div>

                        <div>
                            <label
                                htmlFor="profil"
                                className="block text-sm font-medium text-slate-700"
                            >
                                Deskripsi Profil
                            </label>
                            <textarea
                                id="profil"
                                name="profil"
                                defaultValue={dosen.profil ?? ""}
                                rows={7}
                                placeholder="Tulis profil singkat dosen..."
                                className="mt-2 w-full resize-y rounded-lg border border-slate-200 px-3 py-2.5 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>
                    </div>
                </section>

                {/* Actions */}
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Link
                        href="/admin/dosen"
                        className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                        Batal
                    </Link>

                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center justify-center rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {saving ? "Menyimpan..." : "Simpan Perubahan"}
                    </button>
                </div>
            </form>
        </div>
    );
}