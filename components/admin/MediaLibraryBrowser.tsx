"use client";

import { useEffect, useId, useState } from "react";
import ImageWithFallback from "@/components/ImageWithFallback";
import {
    MEDIA_LIBRARY_MAX_QUERY_LENGTH,
    mediaLibraryApiHref,
    type MediaLibraryFilters,
} from "@/lib/media/library-filters";
import type {
    MediaLibraryItem,
    MediaLibraryPage,
} from "@/lib/media/library-list";

type Props = {
    onSelect?: (item: MediaLibraryItem) => void;
};

const control =
    "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-blue-700";

export default function MediaLibraryBrowser({
    onSelect,
}: Props) {
    const id = useId();
    const [query, setQuery] = useState("");
    const [filters, setFilters] =
        useState<MediaLibraryFilters>({
            q: "",
            jenis: onSelect ? "GAMBAR" : "",
            page: 1,
        });
    const [retry, setRetry] = useState(0);
    const [reply, setReply] = useState<{
        key: string;
        data?: MediaLibraryPage;
        error?: string;
    } | null>(null);
    const [selected, setSelected] =
        useState<MediaLibraryItem | null>(null);

    const href = mediaLibraryApiHref(filters);
    const requestKey = `${href}:${retry}`;
    const current =
        reply?.key === requestKey ? reply : null;
    const loading = current === null;

    useEffect(() => {
        const controller = new AbortController();

        async function load() {
            try {
                const response = await fetch(href, {
                    signal: controller.signal,
                    cache: "no-store",
                });

                const body = await response.json();

                if (!response.ok) {
                    throw new Error(
                        body.message ||
                        "Pustaka media gagal dimuat.",
                    );
                }

                if (!Array.isArray(body.items)) {
                    throw new Error(
                        "Daftar media tidak dapat dibaca.",
                    );
                }

                if (!controller.signal.aborted) {
                    setReply({
                        key: requestKey,
                        data: body,
                    });
                }
            } catch (error) {
                if (!controller.signal.aborted) {
                    setReply({
                        key: requestKey,
                        error: error instanceof Error
                            ? error.message
                            : "Pustaka media gagal dimuat.",
                    });
                }
            }
        }

        void load();

        return () => controller.abort();
    }, [href, requestKey]);

    function search() {
        setSelected(null);
        setFilters((previous) => ({
            ...previous,
            q: query.trim(),
            page: 1,
        }));
    }

    const data = current?.data;

    return (
        <div
            className="space-y-4"
            aria-busy={loading}
        >
            <div className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <div className="min-w-40 flex-1">
                    <label
                        htmlFor={`${id}-q`}
                        className="mb-1 block text-sm font-medium"
                    >
                        Cari media
                    </label>

                    <input
                        id={`${id}-q`}
                        type="search"
                        value={query}
                        maxLength={MEDIA_LIBRARY_MAX_QUERY_LENGTH}
                        onChange={(event) =>
                            setQuery(event.target.value)
                        }
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                event.preventDefault();
                                search();
                            }
                        }}
                        placeholder="Nama berkas atau judul PDF"
                        className={`${control} w-full`}
                    />
                </div>

                {!onSelect && (
                    <div>
                        <label
                            htmlFor={`${id}-jenis`}
                            className="mb-1 block text-sm font-medium"
                        >
                            Jenis media
                        </label>

                        <select
                            id={`${id}-jenis`}
                            value={filters.jenis}
                            className={control}
                            onChange={(event) => {
                                setSelected(null);
                                setFilters((previous) => ({
                                    ...previous,
                                    jenis: event.target.value as
                                        MediaLibraryFilters["jenis"],
                                    page: 1,
                                }));
                            }}
                        >
                            <option value="">Semua</option>
                            <option value="GAMBAR">Gambar</option>
                            <option value="DOKUMEN">
                                Dokumen PDF
                            </option>
                        </select>
                    </div>
                )}

                <button
                    type="button"
                    onClick={search}
                    className={control}
                >
                    Cari
                </button>

                <button
                    type="button"
                    onClick={() => {
                        setSelected(null);
                        setRetry((value) => value + 1);
                    }}
                    className={control}
                >
                    Muat ulang
                </button>
            </div>

            <p className="text-xs text-slate-500">
                Gambar dicari berdasarkan nama berkas.
                PDF juga bisa dicari berdasarkan judul
                dan nama asli.
            </p>

            {loading && (
                <p
                    role="status"
                    className="py-6 text-sm"
                >
                    Memuat pustaka media...
                </p>
            )}

            {current?.error && (
                <p
                    role="alert"
                    className="text-sm text-red-700"
                >
                    {current.error}
                </p>
            )}

            {data && (
                <>
                    <p
                        role="status"
                        className="text-sm text-slate-600"
                    >
                        {data.total} media · Halaman{" "}
                        {data.page} dari {data.totalPages}
                    </p>

                    {data.items.length === 0 && (
                        <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm">
                            Tidak ada media yang cocok.
                        </p>
                    )}

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        {data.items.map((item) => (
                            <button
                                key={item.url}
                                type="button"
                                onClick={() =>
                                    setSelected(item)
                                }
                                aria-pressed={
                                    selected?.url === item.url
                                }
                                className="overflow-hidden rounded-xl border border-slate-200 bg-white text-left hover:border-blue-600 focus-visible:outline-2 focus-visible:outline-blue-700 aria-pressed:ring-2 aria-pressed:ring-blue-600"
                            >
                                <div className="relative aspect-4/3 bg-slate-100">
                                    {item.jenis === "GAMBAR" ? (
                                        <ImageWithFallback
                                            src={item.url}
                                            alt="Pratinjau gambar unggahan"
                                            fill
                                            sizes="(max-width: 640px) 45vw, 240px"
                                            unoptimized
                                            className="object-contain"
                                            fallback={
                                                <span className="flex h-full items-center justify-center text-xs">
                                                    Pratinjau tidak tersedia
                                                </span>
                                            }
                                        />
                                    ) : (
                                        <span className="flex h-full items-center justify-center text-2xl font-semibold text-slate-500">
                                            PDF
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-1 p-3">
                                    <p className="break-all text-sm font-medium">
                                        {item.title}
                                    </p>

                                    <p className="text-xs text-slate-500">
                                        {(item.size / 1024)
                                            .toFixed(1)} KB
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>

                    {data.totalPages > 1 && (
                        <nav
                            aria-label="Halaman pustaka media"
                            className="flex items-center gap-3"
                        >
                            <button
                                type="button"
                                disabled={data.page <= 1}
                                className={control}
                                onClick={() => {
                                    setSelected(null);
                                    setFilters({
                                        ...filters,
                                        page: data.page - 1,
                                    });
                                }}
                            >
                                Sebelumnya
                            </button>

                            <button
                                type="button"
                                disabled={
                                    data.page >= data.totalPages
                                }
                                className={control}
                                onClick={() => {
                                    setSelected(null);
                                    setFilters({
                                        ...filters,
                                        page: data.page + 1,
                                    });
                                }}
                            >
                                Berikutnya
                            </button>
                        </nav>
                    )}

                    {selected && (
                        <div className="space-y-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
                            <h3 className="break-all font-semibold">
                                {selected.title}
                            </h3>

                            {selected.jenis === "GAMBAR" && (
                                <div className="relative h-64 w-full">
                                    <ImageWithFallback
                                        src={selected.url}
                                        alt="Pratinjau media terpilih"
                                        fill
                                        sizes="640px"
                                        unoptimized
                                        className="object-contain"
                                        fallback={
                                            <span>
                                                Gambar tidak dapat dimuat.
                                            </span>
                                        }
                                    />
                                </div>
                            )}

                            {selected.originalName && (
                                <p className="break-all text-sm">
                                    Nama asli:{" "}
                                    {selected.originalName}
                                </p>
                            )}

                            <p className="break-all text-xs text-slate-600">
                                {selected.filename}
                            </p>

                            <div className="flex flex-wrap gap-4">
                                <a
                                    href={selected.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-800 underline"
                                >
                                    Buka berkas
                                </a>

                                {onSelect &&
                                    selected.jenis === "GAMBAR" && (
                                        <button
                                            type="button"
                                            className={`${control} font-semibold`}
                                            onClick={() =>
                                                onSelect(selected)
                                            }
                                        >
                                            Gunakan gambar ini
                                        </button>
                                    )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
