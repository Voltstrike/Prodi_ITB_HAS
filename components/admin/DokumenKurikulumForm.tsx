"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
    MAX_DOKUMEN_UPLOAD_BYTES,
    MAX_JUDUL_DOKUMEN_LENGTH,
} from "@/lib/dokumen/constants";

export default function DokumenKurikulumForm() {
    const router = useRouter();

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (saving) return;

        setError("");
        setSuccess("");

        const form = event.currentTarget;
        const body = new FormData(form);
        const judul = String(body.get("judul") ?? "").trim();
        const file = body.get("file");

        if (!judul) {
            setError("Judul dokumen wajib diisi.");
            return;
        }

        if (!(file instanceof File) || file.size === 0) {
            setError("Pilih satu berkas PDF.");
            return;
        }

        if (file.size > MAX_DOKUMEN_UPLOAD_BYTES) {
            setError("Ukuran PDF maksimal 10 MB.");
            return;
        }

        body.set("judul", judul);
        setSaving(true);

        try {
            const response = await fetch(
                "/api/admin/dokumen-kurikulum",
                {
                    method: "POST",
                    body,
                },
            );

            if (!response.ok) {
                const result: unknown = await response
                    .json()
                    .catch(() => null);

                const message =
                    result !== null &&
                    typeof result === "object" &&
                    "message" in result &&
                    typeof result.message === "string"
                        ? result.message
                        : "Dokumen gagal diunggah.";

                throw new Error(message);
            }

            form.reset();
            setSuccess("Dokumen berhasil diunggah.");
            router.refresh();
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Dokumen gagal diunggah. Silakan coba kembali.",
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
                Tambah Dokumen
            </h2>

            <p className="mt-2 text-sm text-slate-600">
                Unggah PDF kurikulum untuk pengunjung website.
            </p>

            <form
                onSubmit={handleSubmit}
                aria-busy={saving}
                className="mt-6 space-y-5"
            >
                <fieldset disabled={saving} className="space-y-5">
                    <legend className="sr-only">
                        Informasi dokumen kurikulum
                    </legend>

                    <div>
                        <label
                            htmlFor="judul-dokumen"
                            className="block text-sm font-medium text-slate-700"
                        >
                            Judul Dokumen
                        </label>

                        <input
                            id="judul-dokumen"
                            name="judul"
                            required
                            maxLength={MAX_JUDUL_DOKUMEN_LENGTH}
                            placeholder="Contoh: Kurikulum Magister Manajemen"
                            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="file-dokumen"
                            className="block text-sm font-medium text-slate-700"
                        >
                            Berkas PDF
                        </label>

                        <input
                            id="file-dokumen"
                            name="file"
                            type="file"
                            accept=".pdf,application/pdf"
                            required
                            aria-describedby="file-dokumen-help"
                            className="mt-2 block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:font-medium file:text-blue-700"
                        />

                        <p
                            id="file-dokumen-help"
                            className="mt-2 text-xs text-slate-500"
                        >
                            Format PDF, maksimal 10 MB.
                        </p>
                    </div>
                </fieldset>

                {error && (
                    <p role="alert" className="text-sm text-red-700">
                        {error}
                    </p>
                )}

                {success && (
                    <p role="status" className="text-sm text-green-700">
                        {success}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {saving ? "Mengunggah..." : "Unggah Dokumen"}
                </button>
            </form>
        </section>
    );
}
