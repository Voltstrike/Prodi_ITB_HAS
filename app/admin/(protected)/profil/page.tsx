"use client";

import { FormEvent, useEffect, useState } from "react";

type Profil = {
    sejarah: string;
    visi: string;
    misi: string;
    struktur: string | null;
    akreditasi: string | null;
    dokumenAkreditasi: string | null;
};

export default function ProfilPage() {
    const [form, setForm] = useState<Profil>({
        sejarah: "",
        visi: "",
        misi: "",
        struktur: "",
        akreditasi: "",
        dokumenAkreditasi: "",
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        async function loadProfil() {
            try {
                const response = await fetch("/api/profil");

                if (!response.ok) {
                    throw new Error("Gagal memuat profil.");
                }

                const data = await response.json();

                if (data) {
                    setForm({
                        sejarah: data.sejarah ?? "",
                        visi: data.visi ?? "",
                        misi: data.misi ?? "",
                        struktur: data.struktur ?? "",
                        akreditasi: data.akreditasi ?? "",
                        dokumenAkreditasi: data.dokumenAkreditasi ?? "",
                    });
                }
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Gagal memuat profil.",
                );
            } finally {
                setLoading(false);
            }
        }

        loadProfil();
    }, []);

    function updateField(field: keyof Profil, value: string) {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (!form.sejarah.trim() || !form.visi.trim() || !form.misi.trim()) {
            setError("Sejarah, visi, dan misi wajib diisi.");
            return;
        }

        setSaving(true);

        try {
            const response = await fetch("/api/profil", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(form),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error ?? "Gagal menyimpan profil.");
            }

            setForm({
                sejarah: data.sejarah ?? "",
                visi: data.visi ?? "",
                misi: data.misi ?? "",
                struktur: data.struktur ?? "",
                akreditasi: data.akreditasi ?? "",
                dokumenAkreditasi: data.dokumenAkreditasi ?? "",
            });

            setSuccess("Profil berhasil disimpan.");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Gagal menyimpan profil.",
            );
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <div className="h-8 w-40 animate-pulse rounded bg-slate-200" />
                    <div className="mt-2 h-4 w-72 animate-pulse rounded bg-slate-200" />
                </div>

                <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6">
                    {[1, 2, 3].map((item) => (
                        <div key={item} className="space-y-2">
                            <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                            <div className="h-28 animate-pulse rounded-lg bg-slate-100" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-24 lg:pb-0">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">
                    Profil Program Studi
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    Kelola informasi utama profil program studi.
                </p>
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {success && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {success}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <section className="rounded-xl border border-slate-200 bg-white p-6">
                    <div className="mb-6">
                        <h2 className="text-base font-semibold text-slate-900">
                            Informasi Utama
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Informasi dasar yang ditampilkan pada halaman profil.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label
                                htmlFor="sejarah"
                                className="mb-2 block text-sm font-medium text-slate-700"
                            >
                                Sejarah <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="sejarah"
                                value={form.sejarah}
                                onChange={(event) =>
                                    updateField("sejarah", event.target.value)
                                }
                                rows={8}
                                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                placeholder="Masukkan sejarah program studi..."
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="visi"
                                className="mb-2 block text-sm font-medium text-slate-700"
                            >
                                Visi <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="visi"
                                value={form.visi}
                                onChange={(event) =>
                                    updateField("visi", event.target.value)
                                }
                                rows={5}
                                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                placeholder="Masukkan visi program studi..."
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="misi"
                                className="mb-2 block text-sm font-medium text-slate-700"
                            >
                                Misi <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="misi"
                                value={form.misi}
                                onChange={(event) =>
                                    updateField("misi", event.target.value)
                                }
                                rows={7}
                                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                placeholder="Masukkan misi program studi..."
                            />
                        </div>
                    </div>
                </section>

                <section className="rounded-xl border border-slate-200 bg-white p-6">
                    <div className="mb-6">
                        <h2 className="text-base font-semibold text-slate-900">
                            Informasi Tambahan
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Informasi tambahan yang dapat ditampilkan pada halaman profil.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label
                                htmlFor="struktur"
                                className="mb-2 block text-sm font-medium text-slate-700"
                            >
                                Struktur Organisasi
                            </label>
                            <textarea
                                id="struktur"
                                value={form.struktur ?? ""}
                                onChange={(event) =>
                                    updateField("struktur", event.target.value)
                                }
                                rows={8}
                                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                placeholder="Masukkan informasi struktur organisasi..."
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="akreditasi"
                                className="mb-2 block text-sm font-medium text-slate-700"
                            >
                                Akreditasi
                            </label>
                            <textarea
                                id="akreditasi"
                                value={form.akreditasi ?? ""}
                                onChange={(event) =>
                                    updateField("akreditasi", event.target.value)
                                }
                                rows={5}
                                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                placeholder="Masukkan informasi akreditasi..."
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="dokumenAkreditasi"
                                className="mb-2 block text-sm font-medium text-slate-700"
                            >
                                Dokumen Akreditasi
                            </label>
                            <input
                                id="dokumenAkreditasi"
                                type="url"
                                value={form.dokumenAkreditasi ?? ""}
                                onChange={(event) =>
                                    updateField(
                                        "dokumenAkreditasi",
                                        event.target.value,
                                    )
                                }
                                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                placeholder="https://..."
                            />
                            <p className="mt-2 text-xs text-slate-500">
                                Masukkan URL dokumen akreditasi untuk sementara.
                            </p>
                        </div>
                    </div>
                </section>

                <div className="hidden justify-end gap-3 lg:flex">
                    <button
                        type="submit"
                        disabled={saving}
                        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {saving ? "Menyimpan..." : "Simpan Perubahan"}
                    </button>
                </div>

                <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white p-4 shadow-lg lg:hidden">
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {saving ? "Menyimpan..." : "Simpan Perubahan"}
                    </button>
                </div>
            </form>
        </div>
    );
}
