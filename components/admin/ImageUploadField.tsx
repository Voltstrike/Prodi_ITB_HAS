"use client";

import {
    useEffect,
    useId,
    useRef,
    useState,
    type ChangeEvent,
} from "react";
import ImageWithFallback from "@/components/ImageWithFallback";
import ImageCropDialog from "@/components/admin/ImageCropDialog";
import MediaLibraryDialog from "@/components/admin/MediaLibraryDialog";
import type { MediaLibraryItem } from "@/lib/media/library-list";
import {
    IMAGE_MIME_TYPES,
    MAX_IMAGE_UPLOAD_BYTES,
    isMediaFileName,
} from "@/lib/media/constants";
import type {
    CropAreaPixels,
    ImageCropAspect,
} from "@/lib/media/crop-types";

type Props = {
    name: string;
    label: string;
    initialValue?: string;
    disabled?: boolean;
    onUploadingChange: (uploading: boolean) => void;
    cropAspect?: ImageCropAspect;
    thumbnailName?: string;
    initialThumbnailValue?: string;
    allowLibrarySelection?: boolean;
};

type CropSource = {
    url: string;
    filename: string;
    width: number;
    height: number;
    aspect: ImageCropAspect;
    controller: AbortController;
};

function isImageSide(value: unknown): value is number {
    return (
        typeof value === "number" &&
        Number.isSafeInteger(value) &&
        value > 0 &&
        value <= 1600
    );
}

async function readMediaResult(
    response: Response,
    fallbackMessage: string,
) {
    const data: unknown = await response.json().catch(() => null);

    const result =
        data !== null &&
        typeof data === "object" &&
        !Array.isArray(data)
            ? (data as Record<string, unknown>)
            : null;

    if (!response.ok) {
        throw new Error(
            typeof result?.message === "string"
                ? result.message
                : fallbackMessage,
        );
    }

    const url = result?.url;

    if (
        typeof url !== "string" ||
        !url.startsWith("/media/") ||
        !isMediaFileName(url.slice("/media/".length))
    ) {
        throw new Error("Hasil pemrosesan foto tidak dapat dibaca.");
    }

    return {
        url,
        filename: url.slice("/media/".length),
        width: result?.width,
        height: result?.height,
    };
}

export default function ImageUploadField({
    name,
    label,
    initialValue = "",
    disabled = false,
    onUploadingChange,
    cropAspect,
    thumbnailName,
    initialThumbnailValue = "",
    allowLibrarySelection = false,
}: Props) {
    const id = useId();

    const [value, setValue] = useState(initialValue);
    const [thumbnailValue, setThumbnailValue] = useState(
        initialThumbnailValue,
    );
    const [uploading, setUploading] = useState(false);
    const [cropSource, setCropSource] = useState<CropSource | null>(
        null,
    );
    const [error, setError] = useState("");
    const [status, setStatus] = useState("");
    const [libraryOpen, setLibraryOpen] = useState(false);

    const pending = useRef<AbortController | null>(null);

    useEffect(() => {
        return () => {
            const controller = pending.current;
            pending.current = null;
            controller?.abort();
        };
    }, []);

    function isCurrent(controller: AbortController) {
        return (
            pending.current === controller &&
            !controller.signal.aborted
        );
    }

    function finish(controller: AbortController) {
        if (pending.current !== controller) return;

        pending.current = null;
        setCropSource(null);
        setUploading(false);
        onUploadingChange(false);
    }

    async function selectFromLibrary(item: MediaLibraryItem) {
        if (disabled || pending.current) return;
        if (item.jenis !== "GAMBAR" || !isMediaFileName(item.filename) ||
            item.url !== "/media/" + item.filename) {
            setError("Gambar pustaka tidak valid.");
            return;
        }
        setLibraryOpen(false);
        setError("");
        setStatus("");
        const controller = new AbortController();
        pending.current = controller;
        setUploading(true);
        onUploadingChange(true);
        let openedCrop = false;
        try {
            if (cropAspect) {
                const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
                    const image = new window.Image();
                    const timeout = window.setTimeout(() => fail(), 10000);
                    const cleanup = () => {
                        window.clearTimeout(timeout);
                        controller.signal.removeEventListener("abort", abort);
                        image.onload = null;
                        image.onerror = null;
                    };
                    const fail = () => { cleanup(); image.src = ""; reject(new Error("Gambar tidak dapat dimuat. Pilih ulang dari pustaka.")); };
                    const abort = () => fail();
                    controller.signal.addEventListener("abort", abort, { once: true });
                    image.onerror = fail;
                    image.onload = () => {
                        const width = image.naturalWidth;
                        const height = image.naturalHeight;
                        cleanup();
                        if (!isImageSide(width) || !isImageSide(height)) {
                            reject(new Error("Ukuran gambar pustaka tidak valid."));
                        } else resolve({ width, height });
                    };
                    image.src = item.url;
                });
                if (!isCurrent(controller)) return;
                setCropSource({
                    url: item.url, filename: item.filename,
                    ...dimensions, aspect: cropAspect, controller,
                });
                openedCrop = true;
            } else {
                setValue(item.url);
                setThumbnailValue("");
                setStatus("Gambar pustaka siap digunakan. Simpan data untuk menerapkannya.");
            }
        } catch (failure) {
            if (isCurrent(controller)) setError(failure instanceof Error ? failure.message : "Gambar pustaka gagal dimuat.");
        } finally {
            if (!openedCrop) finish(controller);
        }
    }

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

        const extension = file.name
            .slice(file.name.lastIndexOf(".") + 1)
            .toLowerCase();

        if (
            !["jpg", "jpeg", "png", "webp"].includes(extension) ||
            (
                file.type &&
                !IMAGE_MIME_TYPES.some(
                    (type) => type === file.type,
                )
            )
        ) {
            setError("Gunakan foto JPG, PNG, atau WebP.");
            return;
        }

        const controller = new AbortController();
        pending.current = controller;

        setUploading(true);
        onUploadingChange(true);

        let openedCrop = false;

        try {
            const form = new FormData();
            form.set("file", file);

            const response = await fetch("/api/admin/media", {
                method: "POST",
                body: form,
                signal: controller.signal,
            });

            if (!isCurrent(controller)) return;

            const image = await readMediaResult(
                response,
                "Foto gagal diunggah.",
            );

            if (!isCurrent(controller)) return;

            if (cropAspect) {
                if (
                    !isImageSide(image.width) ||
                    !isImageSide(image.height)
                ) {
                    throw new Error(
                        "Ukuran foto hasil unggahan tidak valid.",
                    );
                }

                setCropSource({
                    url: image.url,
                    filename: image.filename,
                    width: image.width,
                    height: image.height,
                    aspect: cropAspect,
                    controller,
                });

                openedCrop = true;
            } else {
                setValue(image.url);
                setThumbnailValue("");
                setStatus(
                    "Foto siap digunakan. Simpan data untuk menerapkannya.",
                );
            }
        } catch (failure) {
            if (isCurrent(controller)) {
                setError(
                    failure instanceof Error
                        ? failure.message
                        : "Foto gagal diunggah.",
                );
            }
        } finally {
            if (!openedCrop) {
                finish(controller);
            }
        }
    }

    async function applyCrop(area: CropAreaPixels) {
        const source = cropSource;

        if (!source || !isCurrent(source.controller)) return;

        try {
            const response = await fetch("/api/admin/media/crop", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    filename: source.filename,
                    area,
                    aspect: source.aspect,
                }),
                signal: source.controller.signal,
            });

            if (!isCurrent(source.controller)) return;

            const cropped = await readMediaResult(
                response,
                "Foto gagal dipotong.",
            );

            if (!isCurrent(source.controller)) return;

            setValue(thumbnailName ? source.url : cropped.url);
            setThumbnailValue(thumbnailName ? cropped.url : "");
            setError("");
            setStatus(
                "Foto siap digunakan. Simpan data untuk menerapkannya.",
            );

            finish(source.controller);
        } catch (failure) {
            if (isCurrent(source.controller)) {
                throw failure;
            }
        }
    }

    function cancelCrop() {
        const controller = cropSource?.controller;

        if (!controller || pending.current !== controller) return;

        controller.abort();
        setError("");
        setStatus("Pengaturan foto dibatalkan.");
        finish(controller);
    }

    const preview =
        thumbnailName && thumbnailValue ? thumbnailValue : value;

    const previewSize =
        cropAspect === "4/3"
            ? "aspect-4/3 w-full max-w-sm"
            : cropAspect === "16/10"
                ? "aspect-16/10 w-full max-w-sm"
                : "h-48 w-48";

    return (
        <div className="space-y-4">
            <label
                htmlFor={`${id}-file`}
                className="block text-sm font-medium text-slate-700"
            >
                {label}
            </label>

            <input type="hidden" name={name} value={value} />

            {thumbnailName && (
                <input
                    type="hidden"
                    name={thumbnailName}
                    value={thumbnailValue}
                />
            )}

            <div
                className={`relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50 ${previewSize}`}
            >
                <ImageWithFallback
                    key={`${preview}:${value}`}
                    src={preview}
                    fallbackSrc={thumbnailName ? value : undefined}
                    alt={`Pratinjau ${label.toLowerCase()}`}
                    fill
                    sizes={cropAspect ? "384px" : "192px"}
                    unoptimized
                    className={
                        cropAspect ? "object-cover" : "object-contain"
                    }
                    fallback={
                        <p className="flex h-full items-center justify-center p-4 text-center text-xs text-slate-500">
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

            <p
                id={`${id}-help`}
                className="text-xs leading-relaxed text-slate-500"
            >
                JPG, PNG, atau WebP, maksimal 5 MB.
                {cropAspect && (
                    <>
                        {" "}Setelah unggah, atur foto pada bingkai{" "}
                        {cropAspect.replace("/", ":")}.
                    </>
                )}
            </p>

            {allowLibrarySelection && <button type="button" disabled={disabled || uploading}
                onClick={() => setLibraryOpen(true)}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                Pilih dari pustaka
            </button>}

            {uploading && (
                <p role="status" className="text-sm text-blue-700">
                    {cropSource
                        ? "Selesaikan pengaturan foto untuk melanjutkan."
                        : "Mengunggah foto... tunggu hingga selesai."}
                </p>
            )}

            {error && (
                <p role="alert" className="text-sm text-red-700">
                    {error}
                </p>
            )}

            {status && (
                <p role="status" className="text-sm text-emerald-700">
                    {status}
                </p>
            )}

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
                        setThumbnailValue("");
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
                        setThumbnailValue("");
                        setError("");
                        setStatus("");
                    }}
                    className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
                >
                    Kosongkan foto
                </button>
            )}

            {cropSource && (
                <ImageCropDialog
                    key={cropSource.url}
                    src={cropSource.url}
                    sourceWidth={cropSource.width}
                    sourceHeight={cropSource.height}
                    aspect={cropSource.aspect}
                    onApply={applyCrop}
                    onCancel={cancelCrop}
                />
            )}
            {libraryOpen && <MediaLibraryDialog
                onCancel={() => setLibraryOpen(false)}
                onSelect={(item) => { void selectFromLibrary(item); }}
            />}
        </div>
    );
}
