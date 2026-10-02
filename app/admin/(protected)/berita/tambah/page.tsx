"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function TambahBeritaPage() {
    const router = useRouter();

    const [title, setTitle] = useState("");
    const [date, setDate] = useState("");
    const [description, setDescription] = useState("");
    const [image, setImage] = useState("");
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setLoading(true);

        try {
            const response = await fetch("/api/berita", {
                method: "POST",
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
                alert(data.message ?? "Gagal menambahkan berita.");
                return;
            }

            router.push("/admin/berita");
            router.refresh();
        } catch {
            alert("Terjadi kesalahan saat menambahkan berita.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-slate-50">
            <section className="border-b border-slate-200 bg-white">
                <div className="mx-auto max-w-4xl px-6 py-8">
                    <h1 className="text-2xl font-bold text-slate-900">
                        Tambah Berita
                    </h1>
                    <p className="mt-1 text-sm text-slate-600">
                        Tambahkan berita baru untuk Program Studi.
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
                            placeholder="Contoh: 30 September 2026"
                            required
                            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
                        />
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
                            placeholder="/uploads/berita/nama-file.jpg"
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
                            disabled={loading}
                            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? "Menyimpan..." : "Simpan Berita"}
                        </button>
                    </div>
                </form>
            </section>
        </main>
    );
}
