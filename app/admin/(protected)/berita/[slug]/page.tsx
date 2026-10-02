"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Berita = {
    title: string;
    date: string;
    description: string;
    image: string;
    slug: string;
    content: string;
};

export default function EditBeritaPage() {
    const params = useParams<{ slug: string }>();
    const router = useRouter();

    const [berita, setBerita] = useState<Berita | null>(null);
    const [title, setTitle] = useState("");
    const [date, setDate] = useState("");
    const [description, setDescription] = useState("");
    const [image, setImage] = useState("");
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function loadBerita() {
            try {
                const response = await fetch(`/api/berita/${params.slug}`);
                const data = await response.json();

                if (!response.ok) {
                    alert(data.message ?? "Berita tidak ditemukan.");
                    router.push("/admin/berita");
                    return;
                }

                setBerita(data);
                setTitle(data.title);
                setDate(data.date);
                setDescription(data.description);
                setImage(data.image);
                setContent(data.content);
            } catch {
                alert("Gagal mengambil data berita.");
                router.push("/admin/berita");
            } finally {
                setLoading(false);
            }
        }

        loadBerita();
    }, [params.slug, router]);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setSaving(true);

        try {
            const response = await fetch(`/api/berita/${params.slug}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title,
                    date,
                    description,
                    image,
                    content,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message ?? "Gagal mengubah berita.");
                return;
            }

            router.push("/admin/berita");
            router.refresh();
        } catch {
            alert("Terjadi kesalahan saat mengubah berita.");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <main className="min-h-screen bg-slate-50 p-6">
                <div className="mx-auto max-w-4xl rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
                    Memuat berita...
                </div>
            </main>
        );
    }

    if (!berita) {
        return null;
    }

    return (
        <main className="min-h-screen bg-slate-50">
            <section className="border-b border-slate-200 bg-white">
                <div className="mx-auto max-w-4xl px-6 py-8">
                    <h1 className="text-2xl font-bold text-slate-900">
                        Edit Berita
                    </h1>
                    <p className="mt-1 text-sm text-slate-600">
                        Perbarui informasi berita.
                    </p>
                </div>
            </section>

            <section className="mx-auto max-w-4xl px-6 py-8">
                <form
                    onSubmit={handleSubmit}
                    className="space-y-6 rounded-xl border border-slate-200 bg-white p-6"
                >
                    <div>
                        <label className="block text-sm font-medium text-slate-700">
                            Judul
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            required
                            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">
                            Tanggal
                        </label>
                        <input
                            type="text"
                            value={date}
                            onChange={(event) => setDate(event.target.value)}
                            required
                            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">
                            Slug
                        </label>
                        <input
                            type="text"
                            value={berita.slug}
                            disabled
                            className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500"
                        />
                        <p className="mt-1 text-xs text-slate-500">
                            Slug belum dapat diubah melalui form ini.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">
                            Deskripsi
                        </label>
                        <textarea
                            value={description}
                            onChange={(event) =>
                                setDescription(event.target.value)
                            }
                            required
                            rows={4}
                            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">
                            Gambar
                        </label>
                        <input
                            type="text"
                            value={image}
                            onChange={(event) => setImage(event.target.value)}
                            required
                            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700">
                            Isi Berita
                        </label>
                        <textarea
                            value={content}
                            onChange={(event) =>
                                setContent(event.target.value)
                            }
                            required
                            rows={12}
                            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => router.push("/admin/berita")}
                            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Batal
                        </button>

                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving ? "Menyimpan..." : "Simpan Perubahan"}
                        </button>
                    </div>
                </form>
            </section>
        </main>
    );
}
