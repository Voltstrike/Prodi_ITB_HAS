"use client";

import { useState } from "react";

export default function ExportAuditButton({ query, hasPeriod }: {
    query: string;
    hasPeriod: boolean;
}) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    async function download() {
        setBusy(true);
        setError("");
        try {
            const response = await fetch("/api/admin/audit-log/export" + query, {
                method: "POST",
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Ekspor gagal.");
            }

            const params = new URLSearchParams(query);
            const href = URL.createObjectURL(await response.blob());
            const link = document.createElement("a");
            link.href = href;
            link.download = `audit-log_${params.get("from")}_sd_${params.get("to")}.xlsx`;
            link.click();
            window.setTimeout(() => URL.revokeObjectURL(href), 60_000);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Gagal mengunduh berkas.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="flex flex-wrap items-center gap-3">
            {!hasPeriod && <span className="text-sm text-slate-600">Terapkan kedua tanggal untuk mengekspor.</span>}
            <button type="button" onClick={download} disabled={busy || !hasPeriod}
                className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {busy ? "Menyiapkan berkas…" : "Ekspor Excel (.xlsx)"}
            </button>
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        </div>
    );
}
