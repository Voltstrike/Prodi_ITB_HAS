"use client";

import {
    useCallback,
    useEffect,
    useId,
    useRef,
    useState,
} from "react";
import Cropper from "react-easy-crop";
import {
    IMAGE_CROP_PRESETS,
    type CropAreaPixels,
    type ImageCropAspect,
} from "@/lib/media/crop-types";

type Props = {
    src: string;
    sourceWidth: number;
    sourceHeight: number;
    aspect: ImageCropAspect;
    onApply: (area: CropAreaPixels) => Promise<void>;
    onCancel: () => void;
};

export default function ImageCropDialog({
    src,
    sourceWidth,
    sourceHeight,
    aspect,
    onApply,
    onCancel,
}: Props) {
    const id = useId();
    const dialogRef = useRef<HTMLDialogElement>(null);
    const areaRef = useRef<CropAreaPixels | null>(null);
    const applyingRef = useRef(false);

    const [ready, setReady] = useState(false);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [cropReady, setCropReady] = useState(false);
    const [applying, setApplying] = useState(false);
    const [error, setError] = useState("");

    const preset = IMAGE_CROP_PRESETS[aspect];

    useEffect(() => {
        const dialog = dialogRef.current;

        if (!dialog) return;

        if (!dialog.open) {
            dialog.showModal();
        }

        // Pasang cropper setelah ukuran dialog tersedia.
        const frame = requestAnimationFrame(() => {
            setReady(true);
        });

        return () => {
            cancelAnimationFrame(frame);

            if (dialog.open) {
                dialog.close();
            }
        };
    }, []);

    const captureArea = useCallback(
        (_percent: unknown, pixels: CropAreaPixels) => {
            areaRef.current = pixels;
        },
        [],
    );

    const completeCrop = useCallback(
        (percent: unknown, pixels: CropAreaPixels) => {
            captureArea(percent, pixels);
            setCropReady(pixels.width > 0 && pixels.height > 0);
        },
        [captureArea],
    );

    const handleMediaError = useCallback(() => {
        areaRef.current = null;
        setCropReady(false);
        setError(
            "Foto gagal dimuat. Pilih Batal, lalu unggah ulang foto.",
        );
    }, []);

    async function handleApply() {
        const area = areaRef.current;

        if (!area || applyingRef.current) return;

        if (
            !Number.isSafeInteger(sourceWidth) ||
            !Number.isSafeInteger(sourceHeight) ||
            sourceWidth < 1 ||
            sourceHeight < 1 ||
            ![
                area.x,
                area.y,
                area.width,
                area.height,
            ].every(Number.isFinite) ||
            area.width <= 0 ||
            area.height <= 0
        ) {
            setError("Area foto tidak valid. Pilih ulang foto.");
            return;
        }

        const x = Math.max(
            0,
            Math.min(sourceWidth - 1, Math.round(area.x)),
        );

        const y = Math.max(
            0,
            Math.min(sourceHeight - 1, Math.round(area.y)),
        );

        const width = Math.min(
            sourceWidth - x,
            Math.max(1, Math.round(area.width)),
        );

        const height = Math.min(
            sourceHeight - y,
            Math.max(1, Math.round(area.height)),
        );

        applyingRef.current = true;
        setApplying(true);
        setError("");

        try {
            await onApply({ x, y, width, height });
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Foto gagal dipotong. Silakan coba kembali.",
            );
        } finally {
            applyingRef.current = false;
            setApplying(false);
        }
    }

    return (
        <dialog
            ref={dialogRef}
            aria-labelledby={`${id}-title`}
            aria-describedby={`${id}-description`}
            aria-busy={applying}
            onCancel={(event) => {
                event.preventDefault();
                onCancel();
            }}
            onKeyDown={(event) => {
                if (
                    event.key === "Enter" &&
                    !(event.target instanceof HTMLButtonElement)
                ) {
                    event.preventDefault();
                }
            }}
            className="m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-3xl overflow-y-auto rounded-xl border-0 bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-900/60"
        >
            <div className="border-b border-slate-200 p-5">
                <h2
                    id={`${id}-title`}
                    className="text-lg font-semibold"
                >
                    Atur Tampilan Foto
                </h2>

                <p
                    id={`${id}-description`}
                    className="mt-2 text-sm text-slate-600"
                >
                    Geser foto dan atur zoom agar bagian yang diinginkan
                    masuk ke bingkai. Rasio {aspect.replace("/", ":")}.
                </p>
            </div>

            <div
                inert={applying}
                className="relative h-[45vh] min-h-60 w-full bg-slate-900"
            >
                {ready && (
                    <Cropper
                        image={src}
                        crop={crop}
                        zoom={zoom}
                        aspect={preset.width / preset.height}
                        rotation={0}
                        minZoom={1}
                        maxZoom={3}
                        zoomWithScroll={false}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropAreaChange={captureArea}
                        onCropComplete={completeCrop}
                        mediaProps={{
                            onError: handleMediaError,
                        }}
                    />
                )}

                {!cropReady && !error && (
                    <p
                        role="status"
                        className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center text-sm text-white"
                    >
                        Memuat foto...
                    </p>
                )}
            </div>

            <div className="space-y-4 p-5">
                <div className="flex items-center justify-between gap-4">
                    <label
                        htmlFor={`${id}-zoom`}
                        className="text-sm font-medium"
                    >
                        Zoom
                    </label>

                    <span className="text-sm text-slate-500">
                        {zoom.toFixed(2)}×
                    </span>
                </div>

                <input
                    id={`${id}-zoom`}
                    type="range"
                    min="1"
                    max="3"
                    step="0.01"
                    value={zoom}
                    disabled={applying || !cropReady}
                    onChange={(event) =>
                        setZoom(Number(event.target.value))
                    }
                    className="w-full accent-blue-700"
                />

                {error && (
                    <p role="alert" className="text-sm text-red-700">
                        {error}
                    </p>
                )}
            </div>

            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white p-5">
                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                    Batal
                </button>

                <button
                    type="button"
                    disabled={applying || !cropReady}
                    onClick={handleApply}
                    className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {applying ? "Memproses..." : "Gunakan Foto"}
                </button>
            </div>
        </dialog>
    );
}
