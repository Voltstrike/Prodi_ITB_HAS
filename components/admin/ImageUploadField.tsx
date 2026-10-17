"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import ImageWithFallback from "@/components/ImageWithFallback";
import {
    IMAGE_MIME_TYPES,
    MAX_IMAGE_UPLOAD_BYTES,
    isMediaFileName,
} from "@/lib/media/constants";

type Props = {
    name: string;
    label: string;
    initialValue?: string;
    disabled?: boolean;
    onUploadingChange: (uploading: boolean) => void;
};

export default function ImageUploadField({
    name, label, initialValue = "", disabled = false, onUploadingChange,
}: Props) {
    const id = useId();
    const [value, setValue] = useState(initialValue);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");
    const [status, setStatus] = useState("");
    const pending = useRef<AbortController | null>(null);

    useEffect(() => () => pending.current?.abort(), []);

    async function upload(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        event.target.value = "";

        if (!file || pending.current || disabled) return;

        setError("");
        setStatus("");

        if (file.size === 0 || file.size > MAX_IMAGE_UPLOAD_BYTES) {
            setError("Pilih foto berukuran maksimal 5 MB.");
            return;
        }

        const extension = file.name.slice(file.name.lastIndexOf(".") + 1).toLowerCase();
        if (!["jpg", "jpeg", "png", "webp"].includes(extension) ||
            (file.type && !IMAGE_MIME_TYPES.some((type) => type === file.type))) {
            setError("Gunakan foto JPG, PNG, atau WebP.");
            return;
        }

        const controller = new AbortController();
        pending.current = controller;
        setUploading(true);
        onUploadingChange(true);

        try {
            const form = new FormData();
            form.set("file", file);

            const response = await fetch("/api/admin/media", {
                method: "POST",
                body: form,
                signal: controller.signal,
            });

            const data = await response.json().catch(() => null);
            if (!response.ok) {
                throw new Error(
                    typeof data?.message === "string"
                        ? data.message
                        : "Foto gagal diunggah.",
                );
            }

            if (typeof data?.url !== "string" ||
                !data.url.startsWith("/media/") ||
                !isMediaFileName(data.url.slice("/media/".length))) {
                throw new Error("Hasil unggahan tidak dapat dibaca.");
            }

            setValue(data.url);
            setStatus("Foto siap digunakan. Simpan data untuk menerapkannya.");
        } catch (failure) {
            if (!controller.signal.aborted) {
                setError(
                    failure instanceof Error
                        ? failure.message
                        : "Foto gagal diunggah.",
                );
            }
        } finally {
            pending.current = null;
            setUploading(false);
            onUploadingChange(false);
        }
    }

    return (
        <div className="space-y-4">
            <label
                htmlFor={`${id}-file`}
                className="block text-sm font-medium text-slate-700"
            >
                {label}
            </label>

            <input type="hidden" name={name} value={value} />

            <div className="flex min-h-48 w-48 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                <ImageWithFallback
                    key={value}
                    src={value}
                    alt={`Pratinjau ${label.toLowerCase()}`}
                    width={240}
                    height={240}
                    unoptimized
                    className="h-48 w-48 object-contain"
                    fallback={
                        <p className="p-4 text-center text-xs text-slate-500">
                            Pratinjau foto
                        </p>
                    }
                />
            </div>

            <input
                id={`${id}-file`}
                type="file"
                accept={IMAGE_MIME_TYPES.join(",")}
                disabled={disabled || uploading}
                onChange={upload}
                aria-describedby={`${id}-help`}
                className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2.5 file:font-semibold file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
            />

            <p id={`${id}-help`} className="text-xs leading-relaxed text-slate-500">
                JPG, PNG, atau WebP, maksimal 5 MB. Pratinjau muncul setelah unggahan selesai.
            </p>

            {uploading && (
                <p role="status" className="text-sm text-blue-700">
                    Mengunggah foto... tunggu hingga selesai sebelum menyimpan.
                </p>
            )}
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            {status && <p role="status" className="text-sm text-emerald-700">{status}</p>}

            <details className="rounded-lg border border-slate-200 p-3 text-sm">
                <summary className="cursor-pointer font-medium text-slate-600">
                    Gunakan tautan gambar
                </summary>
                <label
                    htmlFor={`${id}-url`}
                    className="mt-3 block text-xs text-slate-500"
                >
                    Tautan gambar
                </label>
                <input
                    id={`${id}-url`}
                    value={value}
                    disabled={disabled || uploading}
                    onChange={(event) => {
                        setValue(event.target.value);
                        setError("");
                        setStatus("");
                    }}
                    placeholder="https://..."
                    maxLength={2048}
                    className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
            </details>

            {value && (
                <button
                    type="button"
                    disabled={disabled || uploading}
                    onClick={() => {
                        setValue("");
                        setError("");
                        setStatus("");
                    }}
                    className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
                >
                    Kosongkan foto
                </button>
            )}
        </div>
    );
}
