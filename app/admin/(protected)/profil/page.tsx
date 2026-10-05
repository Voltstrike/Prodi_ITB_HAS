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

export default function AdminProfilPage() {
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
    const [message, setMessage] = useState("");

    useEffect(() => {
        async function loadProfil() {
            const response = await fetch("/api/profil");
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

            setLoading(false);
        }

        loadProfil();
    }, []);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setSaving(true);
        setMessage("");

        const response = await fetch("/api/profil", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(form),
        });

        const data = await response.json();

        if (!response.ok) {
            setMessage(data.error ?? "Gagal menyimpan profil.");
            setSaving(false);
            return;
        }

        setMessage("Profil berhasil disimpan.");
        setSaving(false);
    }

    function updateField(field: keyof Profil, value: string) {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    }

    if (loading) {
        return (
            <main className="mx-auto max-w-4xl px-6 py-10">
                <p>Memuat profil...</p>
            </main>
        );
    }

    return (
        <main className="mx-auto max-w-4xl px-6 py-10">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">
                    Profil Program Studi
                </h1>
                <p className="mt-2 text-slate-600">
                    Kelola informasi profil Program Studi Magister Manajemen.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label
                        htmlFor="sejarah"
                        className="mb-2 block font-medium text-slate-900"
                    >
                        Sejarah
                    </label>
                    <textarea
                        id="sejarah"
                        value={form.sejarah}
                        onChange={(event) =>
                            updateField("sejarah", event.target.value)
                        }
                        rows={8}
                        required
                        className="w-full rounded-lg border border-slate-300 px-4 py-3"
                    />
                </div>

                <div>
                    <label
                        htmlFor="visi"
                        className="mb-2 block font-medium text-slate-900"
                    >
                        Visi
                    </label>
                    <textarea
                        id="visi"
                        value={form.visi}
                        onChange={(event) =>
                            updateField("visi", event.target.value)
                        }
                        rows={4}
                        required
                        className="w-full rounded-lg border border-slate-300 px-4 py-3"
                    />
                </div>

                <div>
                    <label
                        htmlFor="misi"
                        className="mb-2 block font-medium text-slate-900"
                    >
                        Misi
                    </label>
                    <textarea
                        id="misi"
                        value={form.misi}
                        onChange={(event) =>
                            updateField("misi", event.target.value)
                        }
                        rows={6}
                        required
                        className="w-full rounded-lg border border-slate-300 px-4 py-3"
                    />
                </div>

                <div>
                    <label
                        htmlFor="struktur"
                        className="mb-2 block font-medium text-slate-900"
                    >
                        Struktur Organisasi
                    </label>
                    <textarea
                        id="struktur"
                        value={form.struktur ?? ""}
                        onChange={(event) =>
                            updateField("struktur", event.target.value)
                        }
                        rows={4}
                        className="w-full rounded-lg border border-slate-300 px-4 py-3"
                    />
                    <p className="mt-1 text-sm text-slate-500">
                        Sementara berupa teks. Upload gambar akan ditambahkan
                        setelah storage hosting ditentukan.
                    </p>
                </div>

                <div>
                    <label
                        htmlFor="akreditasi"
                        className="mb-2 block font-medium text-slate-900"
                    >
                        Akreditasi
                    </label>
                    <textarea
                        id="akreditasi"
                        value={form.akreditasi ?? ""}
                        onChange={(event) =>
                            updateField("akreditasi", event.target.value)
                        }
                        rows={4}
                        className="w-full rounded-lg border border-slate-300 px-4 py-3"
                    />
                </div>

                <div>
                    <label
                        htmlFor="dokumenAkreditasi"
                        className="mb-2 block font-medium text-slate-900"
                    >
                        Dokumen Akreditasi
                    </label>
                    <input
                        id="dokumenAkreditasi"
                        type="text"
                        value={form.dokumenAkreditasi ?? ""}
                        onChange={(event) =>
                            updateField(
                                "dokumenAkreditasi",
                                event.target.value,
                            )
                        }
                        placeholder="Path atau URL dokumen"
                        className="w-full rounded-lg border border-slate-300 px-4 py-3"
                    />
                    <p className="mt-1 text-sm text-slate-500">
                        Upload dokumen akan ditambahkan setelah storage hosting
                        ditentukan.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="rounded-lg bg-blue-700 px-5 py-3 font-medium text-white disabled:opacity-50"
                    >
                        {saving ? "Menyimpan..." : "Simpan Profil"}
                    </button>

                    {message && (
                        <p className="text-sm text-slate-600">{message}</p>
                    )}
                </div>
            </form>
        </main>
    );
}
