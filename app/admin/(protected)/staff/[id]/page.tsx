"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type Staff = {
    id: number;
    nama: string;
    pendidikan: string | null;
    jabatan: string;
    lingkupKerja: string | null;
    foto: string | null;
};

export default function EditStaffPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const [staffId, setStaffId] = useState<string | null>(null);
    const [staff, setStaff] = useState<Staff | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        params.then(({ id }) => {
            setStaffId(id);

            fetch(`/api/staff/${id}`)
                .then(async (response) => {
                    if (!response.ok) {
                        const error = await response.json();
                        throw new Error(
                            error.message ?? "Gagal mengambil data staff",
                        );
                    }

                    return response.json();
                })
                .then((data) => {
                    setStaff(data);
                    setLoading(false);
                })
                .catch((error) => {
                    alert(error.message);
                    window.location.href = "/admin/staff";
                });
        });
    }, [params]);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!staffId || saving) {
            return;
        }

        setSaving(true);

        const form = new FormData(event.currentTarget);

        const nama = form.get("nama")?.toString() ?? "";
        const pendidikan = form.get("pendidikan")?.toString() ?? "";
        const jabatan = form.get("jabatan")?.toString() ?? "";
        const lingkupKerja =
            form.get("lingkupKerja")?.toString() ?? "";
        const foto = form.get("foto")?.toString() ?? "";

        const response = await fetch(`/api/staff/${staffId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                nama,
                pendidikan,
                jabatan,
                lingkupKerja,
                foto,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            alert(error.message ?? "Gagal mengubah staff");
            setSaving(false);
            return;
        }

        alert("Staff berhasil diubah");
        window.location.href = "/admin/staff";
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <div className="h-4 w-36 animate-pulse rounded bg-slate-200" />
                    <div className="mt-4 h-8 w-48 animate-pulse rounded bg-slate-200" />
                    <div className="mt-2 h-4 w-80 animate-pulse rounded bg-slate-200" />
                </div>

                <div className="space-y-6">
                    <div className="h-56 animate-pulse rounded-xl bg-slate-200" />
                    <div className="h-48 animate-pulse rounded-xl bg-slate-200" />
                </div>
            </div>
        );
    }

    if (!staff) {
        return null;
    }

    return (
        <div className="mx-auto max-w-4xl space-y-8 pb-24 sm:pb-0">
            <section>
                <Link
                    href="/admin/staff"
                    className="inline-flex items-center text-sm font-medium text-blue-700 hover:text-blue-800"
                >
                    ← Kembali ke Data Staff
                </Link>

                <div className="mt-4">
                    <h1 className="text-2xl font-bold text-slate-900">
                        Edit Staff
                    </h1>
                    <p className="mt-1 text-sm text-slate-600">
                        Perbarui informasi staff Program Studi Magister
                        Manajemen.
                    </p>
                </div>
            </section>

            <form
                id="edit-staff-form"
                onSubmit={handleSubmit}
                className="space-y-6"
            >
                <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-6 py-5">
                        <h2 className="font-semibold text-slate-900">
                            Informasi Dasar
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Informasi utama staff.
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
                                defaultValue={staff.nama}
                                required
                                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="jabatan"
                                className="block text-sm font-medium text-slate-700"
                            >
                                Jabatan
                            </label>

                            <input
                                id="jabatan"
                                name="jabatan"
                                defaultValue={staff.jabatan}
                                required
                                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="pendidikan"
                                className="block text-sm font-medium text-slate-700"
                            >
                                Pendidikan
                            </label>

                            <input
                                id="pendidikan"
                                name="pendidikan"
                                defaultValue={staff.pendidikan ?? ""}
                                placeholder="Latar belakang pendidikan"
                                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label
                                htmlFor="lingkupKerja"
                                className="block text-sm font-medium text-slate-700"
                            >
                                Lingkup Kerja
                            </label>

                            <input
                                id="lingkupKerja"
                                name="lingkupKerja"
                                defaultValue={staff.lingkupKerja ?? ""}
                                placeholder="Masukkan lingkup kerja"
                                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>
                    </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-6 py-5">
                        <h2 className="font-semibold text-slate-900">
                            Profil
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Informasi tambahan staff.
                        </p>
                    </div>

                    <div className="p-6">
                        <label
                            htmlFor="foto"
                            className="block text-sm font-medium text-slate-700"
                        >
                            URL Foto
                        </label>

                        <input
                            id="foto"
                            name="foto"
                            defaultValue={staff.foto ?? ""}
                            placeholder="https://..."
                            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />

                        <p className="mt-2 text-xs text-slate-500">
                            Upload foto akan kita tambahkan setelah storage
                            hosting ditentukan.
                        </p>
                    </div>
                </section>

                <div className="hidden justify-end gap-3 sm:flex">
                    <Link
                        href="/admin/staff"
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

            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-4px_16px_rgba(15,23,42,0.08)] backdrop-blur sm:hidden">
                <div className="mx-auto flex max-w-4xl gap-3">
                    <Link
                        href="/admin/staff"
                        className="flex flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                        Batal
                    </Link>

                    <button
                        type="submit"
                        form="edit-staff-form"
                        disabled={saving}
                        className="flex flex-1 items-center justify-center rounded-lg bg-blue-700 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {saving ? "Menyimpan..." : "Simpan Perubahan"}
                    </button>
                </div>
            </div>
        </div>
    );
}