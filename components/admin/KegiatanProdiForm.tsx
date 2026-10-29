"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { toKegiatanProdiDto } from "@/lib/http/dto";
import DosenSelectField from "./DosenSelectField";
import KegiatanProdiFields from "./KegiatanProdiFields";
import ImageUploadField from "./ImageUploadField";

type Props = {
    dosen: { id: number; nama: string }[];
    initialValue?: ReturnType<typeof toKegiatanProdiDto>;
};

export default function KegiatanProdiForm({
    dosen,
    initialValue,
}: Props) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (saving || uploading || dosen.length === 0) {
            return;
        }

        const form = new FormData(event.currentTarget);
        const text = (name: string) => String(form.get(name) ?? "");

        const body = {
            judul: text("judul"),
            jenis: text("jenis"),
            tahun: Number(text("tahun")),
            dosenId: Number(text("dosenId")),
            ringkasan: text("ringkasan"),
            uraian: text("uraian"),
            foto: text("foto"),
            tautanHasil: text("tautanHasil"),
        };

        setSaving(true);
        setError("");

        try {
            const endpoint = initialValue
                ? `/api/kegiatan-prodi/${encodeURIComponent(initialValue.slug)}`
                : "/api/kegiatan-prodi";

            const response = await fetch(endpoint, {
                method: initialValue ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const result: unknown = await response.json()
                    .catch(() => null);

                const message =
                    result !== null &&
                    typeof result === "object" &&
                    "message" in result &&
                    typeof result.message === "string"
                        ? result.message
                        : "Gagal menyimpan kegiatan.";

                setError(message);
                return;
            }

            router.push("/admin/kegiatan-prodi");
            router.refresh();
        } catch {
            setError("Gagal terhubung ke server. Silakan coba lagi.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-xl border border-slate-200 bg-white p-6"
        >
            {error && (
                <p
                    role="alert"
                    className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
                >
                    {error}
                </p>
            )}

            <KegiatanProdiFields
                initialValue={initialValue}
                disabled={saving}
            />

            <DosenSelectField
                dosen={dosen}
                initialId={initialValue?.dosenId}
                disabled={saving}
            />

            <ImageUploadField
                name="foto"
                label="Foto Kegiatan (opsional)"
                initialValue={initialValue?.foto ?? ""}
                disabled={saving}
                onUploadingChange={setUploading}
            />

            <div className="flex flex-wrap justify-end gap-3">
                <Link
                    href="/admin/kegiatan-prodi"
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                    Batal
                </Link>

                <button
                    type="submit"
                    disabled={saving || uploading || dosen.length === 0}
                    className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {uploading
                        ? "Mengunggah foto..."
                        : saving
                            ? "Menyimpan..."
                            : "Simpan Kegiatan"}
                </button>
            </div>
        </form>
    );
}
