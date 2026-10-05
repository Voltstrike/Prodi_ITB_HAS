"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function TambahDosenPage() {
    const [saving, setSaving] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (saving) {
            return;
        }

        setSaving(true);

        const form = new FormData(event.currentTarget);

        const nama = form.get("nama")?.toString() ?? "";
        const nidn = form.get("nidn")?.toString() ?? "";
        const pendidikanS1 =
            form.get("pendidikanS1")?.toString() ?? "";
        const pendidikanS2 =
            form.get("pendidikanS2")?.toString() ?? "";
        const pendidikanS3 =
            form.get("pendidikanS3")?.toString() ?? "";

        const response = await fetch("/api/dosen", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                nama,
                nidn,
                pendidikanS1,
                pendidikanS2,
                pendidikanS3,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            alert(error.message ?? "Gagal menambahkan dosen");
            setSaving(false);
            return;
        }

        alert("Dosen berhasil ditambahkan");
        window.location.href = "/admin/dosen";
    }

    return (
        <div className="mx-auto max-w-4xl space-y-8">
            {/* Header */}
            <section>
                <Link
                    href="/admin/dosen"
                    className="inline-flex items-center text-sm font-medium text-blue-700 hover:text-blue-800"
                >
                    ← Kembali ke Data Dosen
                </Link>

                <div className="mt-4">
                    <h1 className="text-2xl font-bold text-slate-900">
                        Tambah Dosen
                    </h1>
                    <p className="mt-1 text-sm text-slate-600">
                        Tambahkan data dosen baru ke Program Studi Magister
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
                                required
                                placeholder="Masukkan nama lengkap"
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
                                required
                                placeholder="Masukkan NIDN"
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
                                placeholder="Nama perguruan tinggi"
                                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                        {saving ? "Menyimpan..." : "Tambahkan Dosen"}
                    </button>
                </div>
            </form>
        </div>
    );
}