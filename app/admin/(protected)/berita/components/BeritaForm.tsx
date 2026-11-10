"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import ImageUploadField from "@/components/admin/ImageUploadField";
import type { BeritaStatus } from "@/lib/berita/validation";

type InitialBerita = {
    title: string;
    date: string;
    description: string;
    image: string;
    thumbnail: string | null;
    slug: string;
    content: string;
    status: BeritaStatus;
};

export default function BeritaForm({ initial }: { initial?: InitialBerita }) {
    const router = useRouter();
    const initialStatus = initial?.status ?? "DRAFT";
    const [title, setTitle] = useState(initial?.title ?? "");
    const [date, setDate] = useState(initial?.date ?? "");
    const [description, setDescription] = useState(initial?.description ?? "");
    const [content, setContent] = useState(initial?.content ?? "");
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");

    const actions: BeritaStatus[] = initialStatus === "PUBLISHED"
        ? ["PUBLISHED", "DRAFT"]
        : ["DRAFT", "PUBLISHED"];

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (saving || uploading) return;

        setError("");

        const submitter = (event.nativeEvent as SubmitEvent).submitter;
        const requested = submitter instanceof HTMLButtonElement
            ? submitter.value
            : initialStatus;
        const status: BeritaStatus =
            requested === "PUBLISHED" ? "PUBLISHED" : "DRAFT";

        if (!title.trim()) {
            setError("Judul berita wajib diisi.");
            return;
        }

        const form = new FormData(event.currentTarget);
        const image = form.get("image")?.toString().trim() ?? "";
        const thumbnail = form.get("thumbnail")?.toString().trim() || null;

        if (status === "PUBLISHED" && !image) {
            setError("Pilih gambar berita sebelum menerbitkan.");
            return;
        }

        setSaving(true);

        try {
            const response = await fetch(
                initial
                    ? `/api/berita/${encodeURIComponent(initial.slug)}`
                    : "/api/berita",
                {
                    method: initial ? "PUT" : "POST",
                    credentials: "same-origin",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        title,
                        date,
                        description,
                        image,
                        thumbnail,
                        content,
                        status,
                    }),
                },
            );

            if (!response.ok) {
                const body: unknown = await response.json().catch(() => null);
                setError(
                    body !== null &&
                    typeof body === "object" &&
                    "message" in body &&
                    typeof body.message === "string"
                        ? body.message
                        : "Berita gagal disimpan.",
                );
                return;
            }

            router.push("/admin/berita");
            router.refresh();
        } catch {
            setError("Tidak dapat menghubungi server. Silakan coba lagi.");
        } finally {
            setSaving(false);
        }
    }

    const inputClass =
        "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600";

    return (
        <form
            onSubmit={submit}
            aria-busy={saving}
            className="space-y-6 rounded-xl border border-slate-200 bg-white p-6"
        >
            <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                {initialStatus === "PUBLISHED"
                    ? "Berita ini sedang terbit. Pilih Kembalikan ke Draft untuk menyembunyikannya dari website publik."
                    : "Draft hanya terlihat oleh admin. Cukup isi judul untuk menyimpan, lalu lengkapi sebelum diterbitkan."}
            </p>

            {error && (
                <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
                    {error}
                </p>
            )}

            <fieldset disabled={saving} className="space-y-6 disabled:opacity-70">
                <legend className="sr-only">Data berita</legend>

                <div>
                    <label htmlFor="berita-title" className="block text-sm font-medium text-slate-700">
                        Judul
                    </label>
                    <input
                        id="berita-title"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        maxLength={300}
                        required
                        className={inputClass}
                    />
                </div>

                <div>
                    <label htmlFor="berita-date" className="block text-sm font-medium text-slate-700">
                        Tanggal
                    </label>
                    <input
                        id="berita-date"
                        value={date}
                        onChange={(event) => setDate(event.target.value)}
                        placeholder="Contoh: 10 November 2026"
                        maxLength={64}
                        required
                        className={inputClass}
                    />
                </div>

                <div>
                    <label htmlFor="berita-description" className="block text-sm font-medium text-slate-700">
                        Deskripsi
                    </label>
                    <textarea
                        id="berita-description"
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        maxLength={5000}
                        rows={4}
                        required
                        className={inputClass}
                    />
                </div>

                <div className="space-y-3">
                    <ImageUploadField
                        name="image"
                        label="Gambar Berita"
                        initialValue={initial?.image ?? ""}
                        initialThumbnailValue={initial?.thumbnail ?? ""}
                        cropAspect="16/10"
                        thumbnailName="thumbnail"
                        disabled={saving}
                        onUploadingChange={setUploading}
                    />
                    <p className="text-xs text-slate-500">
                        Foto utama disimpan tanpa crop. Hasil crop digunakan untuk kartu berita.
                    </p>
                </div>

                <div>
                    <label htmlFor="berita-content" className="block text-sm font-medium text-slate-700">
                        Isi Berita
                    </label>
                    <textarea
                        id="berita-content"
                        value={content}
                        onChange={(event) => setContent(event.target.value)}
                        maxLength={100000}
                        rows={12}
                        required
                        className={inputClass}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Link
                        href="/admin/berita"
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        Kembali
                    </Link>

                    {actions.map((status) => (
                        <button
                            key={status}
                            type="submit"
                            name="intent"
                            value={status}
                            formNoValidate={status === "DRAFT"}
                            disabled={saving || uploading}
                            className={`rounded-lg px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
                                status === "PUBLISHED"
                                    ? "bg-blue-700 text-white hover:bg-blue-800"
                                    : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                            }`}
                        >
                            {saving
                                ? "Menyimpan…"
                                : status === "PUBLISHED"
                                    ? initialStatus === "PUBLISHED"
                                        ? "Simpan Perubahan"
                                        : "Terbitkan"
                                    : initialStatus === "PUBLISHED"
                                        ? "Kembalikan ke Draft"
                                        : "Simpan Draft"}
                        </button>
                    ))}
                </div>
            </fieldset>
        </form>
    );
}
