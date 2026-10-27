"use client";

import { useEffect, useState } from "react";
import type { MataKuliahDosen } from "@/lib/dosen/mata-kuliah-data";

export function useMataKuliahOptions() {
    const [options, setOptions] = useState<MataKuliahDosen[] | null>(null);
    const [error, setError] = useState("");
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        const controller = new AbortController();

        async function load() {
            try {
                const response = await fetch("/api/kurikulum", {
                    signal: controller.signal,
                    cache: "no-store",
                });

                if (!response.ok) {
                    throw new Error("Gagal memuat mata kuliah.");
                }

                const data: MataKuliahDosen[] = await response.json();

                if (!Array.isArray(data)) {
                    throw new Error("Format daftar tidak valid.");
                }

                if (controller.signal.aborted) return;

                setOptions([...data].sort((a, b) =>
                    a.semester - b.semester || a.kode.localeCompare(b.kode),
                ));
            } catch {
                if (!controller.signal.aborted) {
                    setError("Daftar mata kuliah gagal dimuat. Silakan coba lagi.");
                }
            }
        }

        void load();

        return () => controller.abort();
    }, [attempt]);

    function retry() {
        setOptions(null);
        setError("");
        setAttempt((current) => current + 1);
    }

    return { options, error, retry };
}