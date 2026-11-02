"use client";

import { useState, type FormEvent } from "react";
import ImageUploadField from "@/components/admin/ImageUploadField";
import {
    FOTO_BERANDA_FIELDS,
    type FotoBerandaKey,
    type FotoBerandaValues,
} from "@/lib/beranda/constants";

type Props = {
    initialValues: FotoBerandaValues;
};

export default function BerandaForm({ initialValues }: Props) {
    const [saving, setSaving] = useState(false);
    const [activeUploads, setActiveUploads] = useState<
        Set<FotoBerandaKey>
    >(() => new Set());
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const uploading = activeUploads.size > 0;

    function updateUploading(
        name: FotoBerandaKey,
        active: boolean,
    ) {
        if (active) {
            setError("");
            setSuccess("");
        }

        setActiveUploads((previous) => {
            const next = new Set(previous);

            if (active) {
                next.add(name);
            } else {
                next.delete(name);
            }

            return next;
        });
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (saving || uploading) return;

        setError("");
        setSuccess("");

        const form = new FormData(event.currentTarget);
        const photos: Partial<FotoBerandaValues> = {};

        for (const { name } of FOTO_BERANDA_FIELDS) {
            const value = form.get(name);

            if (typeof value !== "string") {
                setError(
                    "Data foto belum siap. Muat ulang halaman.",
                );
                return;
            }

            photos[name] = value.trim() || null;
        }

        setSaving(true);

        try {
            const response = await fetch("/api/beranda", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(photos),
            });

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
                        : "Gagal menyimpan foto beranda.";

                throw new Error(message);
            }

            setSuccess(
                "Pengaturan foto beranda berhasil disimpan.",
            );
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Gagal menyimpan foto beranda.",
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            aria-busy={saving || uploading}
            className="space-y-6"
        >
            <div className="grid gap-6 lg:grid-cols-2">
                {FOTO_BERANDA_FIELDS.map(
                    ({ name, label, description, cropAspect }) => (
                        <section
                            key={name}
                            className="min-w-0 space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                        >
                            <p className="text-sm text-slate-500">
                                {description}
                            </p>

                            <ImageUploadField
                                name={name}
                                label={label}
                                cropAspect={cropAspect}
                                initialValue={initialValues[name] ?? ""}
                                disabled={saving || uploading}
                                onUploadingChange={(active) =>
                                    updateUploading(name, active)
                                }
                            />
                        </section>
                    ),
                )}
            </div>

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

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={saving || uploading}
                    className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {uploading
                        ? "Menunggu unggahan foto..."
                        : saving
                            ? "Menyimpan..."
                            : "Simpan Foto Beranda"}
                </button>
            </div>
        </form>
    );
}
