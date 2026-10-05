"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function TambahKurikulumPage() {
    const [saving, setSaving] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (saving) {
            return;
        }

        setSaving(true);

        const form = new FormData(event.currentTarget);

        const kode = form.get("kode")?.toString() ?? "";
        const nama = form.get("nama")?.toString() ?? "";
        const sks = Number(form.get("sks"));
        const semester = Number(form.get("semester"));
        const jenis = form.get("jenis")?.toString() ?? "";

        const response = await fetch("/api/kurikulum", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                kode,
                nama,
                sks,
                semester,
                jenis,
            }),
        });

        if (!response.ok) {
            const error = await response.json();

            alert(error.message ?? "Gagal menambahkan mata kuliah");
            setSaving(false);
            return;
        }

        alert("Mata kuliah berhasil ditambahkan");
        window.location.href = "/admin/kurikulum";
    }

    return (
        <div className="mx-auto max-w-4xl space-y-8 pb-24 sm:pb-0">
            <section>
                <Link
                    href="/admin/kurikulum"
                    className="inline-flex items-center text-sm font-medium text-blue-700 hover:text-blue-800"
                >
                    ← Kembali ke Kurikulum
                </Link>

                <div className="mt-4">
                    <h1 className="text-2xl font-bold text-slate-900">
                        Tambah Mata Kuliah
                    </h1>
                    <p className="mt-1 text-sm text-slate-600">
                        Tambahkan mata kuliah baru ke kurikulum Program Studi
                        Magister Manajemen.
                    </p>
                </div>
            </section>

            <form
                id="tambah-kurikulum-form"
                onSubmit={handleSubmit}
                className="space-y-6"
            >
                <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-6 py-5">
                        <h2 className="font-semibold text-slate-900">
                            Informasi Mata Kuliah
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Masukkan informasi dasar mata kuliah.
                        </p>
                    </div>

                    <div className="grid gap-5 p-6 sm:grid-cols-2">
                        <div>
                            <label
                                htmlFor="kode"
                                className="block text-sm font-medium text-slate-700"
                            >
                                Kode Mata Kuliah
                            </label>
                            <input
                                id="kode"
                                name="kode"
                                required
                                placeholder="Contoh: MM101"
                                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="sks"
                                className="block text-sm font-medium text-slate-700"
                            >
                                SKS
                            </label>
                            <input
                                id="sks"
                                name="sks"
                                type="number"
                                min="1"
                                step="1"
                                required
                                placeholder="Contoh: 3"
                                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label
                                htmlFor="nama"
                                className="block text-sm font-medium text-slate-700"
                            >
                                Nama Mata Kuliah
                            </label>
                            <input
                                id="nama"
                                name="nama"
                                required
                                placeholder="Masukkan nama mata kuliah"
                                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="semester"
                                className="block text-sm font-medium text-slate-700"
                            >
                                Semester
                            </label>
                            <input
                                id="semester"
                                name="semester"
                                type="number"
                                min="1"
                                step="1"
                                required
                                placeholder="Contoh: 1"
                                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="jenis"
                                className="block text-sm font-medium text-slate-700"
                            >
                                Jenis
                            </label>
                            <select
                                id="jenis"
                                name="jenis"
                                required
                                defaultValue=""
                                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            >
                                <option value="" disabled>
                                    Pilih jenis
                                </option>
                                <option value="Wajib">Wajib</option>
                                <option value="Pilihan">Pilihan</option>
                            </select>
                        </div>
                    </div>
                </section>

                <div className="hidden justify-end gap-3 sm:flex">
                    <Link
                        href="/admin/kurikulum"
                        className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                        Batal
                    </Link>

                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center justify-center rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {saving ? "Menyimpan..." : "Tambahkan Mata Kuliah"}
                    </button>
                </div>
            </form>

            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-4px_16px_rgba(15,23,42,0.08)] backdrop-blur sm:hidden">
                <div className="mx-auto flex max-w-4xl gap-3">
                    <Link
                        href="/admin/kurikulum"
                        className="flex flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                        Batal
                    </Link>

                    <button
                        type="submit"
                        form="tambah-kurikulum-form"
                        disabled={saving}
                        className="flex flex-1 items-center justify-center rounded-lg bg-blue-700 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {saving ? "Menyimpan..." : "Tambah"}
                    </button>
                </div>
            </div>
        </div>
    );
}
