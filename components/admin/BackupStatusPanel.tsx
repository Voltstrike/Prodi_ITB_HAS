"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    backupDateTime, backupHealth, backupSize, parseBackupStatusView,
    type BackupHealth, type BackupServiceState, type BackupStatusView,
} from "@/lib/admin/backup-status-model";

const summaries: Record<BackupHealth, [string, string]> = {
    healthy: ["Backup terbaru terverifikasi", "Backup lokal dan salinan Drive berhasil diperiksa."],
    running: ["Backup sedang berjalan", "Status akan diperbarui setelah proses selesai."],
    failed: ["Backup perlu diperiksa", "Proses backup lokal atau unggah Drive mencatat kegagalan."],
    late: ["Backup terlambat", "Jadwal terlewat atau sudah lebih dari 26 jam tanpa backup sukses."],
    stale: ["Data status belum diperbarui", "Pembaruan status terakhir sudah lebih dari tiga menit."],
    paused: ["Jadwal backup tidak aktif", "Periksa jadwal sebelum mengandalkan backup berikutnya."],
    pending: ["Menunggu catatan backup lengkap", "Sebagian informasi belum tersedia untuk menyatakan backup terverifikasi."],
    unverified: ["Pemulihan belum terverifikasi", "Pemeriksaan konfigurasi pemulihan belum tercatat lengkap."],
    unavailable: ["Status backup belum tersedia", "Sumber status belum terhubung atau belum dapat dibaca di lingkungan ini."],
};
const serviceLabels: Record<BackupServiceState, string> = {
    success: "Berhasil", failed: "Gagal", running: "Berjalan", unknown: "Belum diketahui",
};
const box = "rounded-2xl border border-slate-200 bg-white p-5 sm:p-6";

function Row({ label, value }: { label: string; value: string }) {
    return <div className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between sm:gap-6">
        <dt className="text-sm text-slate-500">{label}</dt>
        <dd className="text-sm font-medium text-slate-900 sm:text-right">{value}</dd>
    </div>;
}

export default function BackupStatusPanel({ initial }: { initial: BackupStatusView }) {
    const [view, setView] = useState(initial);
    const [pending, setPending] = useState(false);
    const [updateFailed, setUpdateFailed] = useState(false);
    const [denied, setDenied] = useState(false);
    const mounted = useRef(false);
    const busy = useRef(false);
    const blocked = useRef(false);
    const currentRequest = useRef<AbortController | null>(null);

    const refresh = useCallback(async () => {
        if (busy.current || blocked.current) return;
        busy.current = true;
        setPending(true);
        const controller = new AbortController();
        currentRequest.current = controller;
        const timeout = window.setTimeout(() => controller.abort(), 10_000);
        try {
            const response = await fetch("/api/admin/backup-status", {
                cache: "no-store", credentials: "same-origin", signal: controller.signal,
            });
            if (response.status === 401 || response.status === 403) {
                blocked.current = true;
                if (mounted.current) setDenied(true);
                return;
            }
            if (!response.ok) throw new Error("Status unavailable");
            const next = parseBackupStatusView(await response.json());
            if (mounted.current) { setView(next); setUpdateFailed(false); }
        } catch {
            if (mounted.current) setUpdateFailed(true);
        } finally {
            window.clearTimeout(timeout);
            busy.current = false;
            if (mounted.current) setPending(false);
        }
    }, []);

    useEffect(() => {
        mounted.current = true;
        const updateWhenVisible = () => { if (document.visibilityState === "visible") void refresh(); };
        const interval = window.setInterval(updateWhenVisible, 60_000);
        document.addEventListener("visibilitychange", updateWhenVisible);
        return () => {
            mounted.current = false;
            window.clearInterval(interval);
            document.removeEventListener("visibilitychange", updateWhenVisible);
            currentRequest.current?.abort();
        };
    }, [refresh]);

    if (denied) return <section className={box}>
        <h1 className="text-xl font-bold text-slate-900">Status Backup</h1>
        <p role="alert" className="mt-3 text-sm text-slate-600">Akses status backup sudah berakhir.</p>
        <Link href="/admin" className="mt-4 inline-block text-sm font-semibold text-blue-700">Kembali ke admin</Link>
    </section>;

    const health = backupHealth(view);
    const [title, description] = updateFailed
        ? ["Pembaruan status tertunda", "Koneksi pembaruan gagal. Informasi di bawah berasal dari pemeriksaan terakhir."]
        : summaries[health];
    const color = updateFailed ? "border-amber-200 bg-amber-50 text-amber-950"
        : health === "healthy" ? "border-emerald-200 bg-emerald-50 text-emerald-950"
        : health === "failed" ? "border-red-200 bg-red-50 text-red-950"
        : health === "running" ? "border-blue-200 bg-blue-50 text-blue-950"
        : "border-amber-200 bg-amber-50 text-amber-950";
    const data = view.data;

    return <div className="max-w-5xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div><h1 className="text-2xl font-bold text-slate-900">Status Backup</h1>
                <p className="mt-1 text-sm text-slate-600">Pantau cadangan lokal dan salinan terenkripsi di Google Drive.</p></div>
            <button type="button" onClick={() => void refresh()} disabled={pending} aria-busy={pending}
                className="w-fit rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-wait disabled:opacity-60">
                {pending ? "Memperbarui..." : "Perbarui status"}
            </button>
        </header>
        <section aria-live="polite" aria-atomic="true" className={`rounded-2xl border p-5 ${color}`}>
            <h2 className="font-semibold">{title}</h2><p className="mt-1 text-sm">{description}</p>
        </section>
        {data && <>
            <div className="grid gap-5 md:grid-cols-2">
                <section className={box}><h2 className="text-base font-semibold text-slate-900">Backup lokal</h2>
                    <dl className="mt-3 divide-y divide-slate-100">
                        <Row label="Hasil proses terakhir" value={serviceLabels[data.local.state]} />
                        <Row label="Terakhir berhasil" value={backupDateTime(data.local.lastSuccessAt)} />
                        <Row label="Ukuran arsip terakhir" value={backupSize(data.local.latestArchiveBytes)} />
                        <Row label="Arsip lokal tersedia" value={data.local.availableArchives?.toLocaleString("id-ID") ?? "Belum tersedia"} />
                    </dl></section>
                <section className={box}><h2 className="text-base font-semibold text-slate-900">Google Drive</h2>
                    <dl className="mt-3 divide-y divide-slate-100">
                        <Row label="Hasil proses terakhir" value={serviceLabels[data.drive.state]} />
                        <Row label="Terakhir terverifikasi" value={backupDateTime(data.drive.lastSuccessAt)} />
                        <Row label="Arsip diperiksa pada proses terakhir" value={data.drive.verifiedArchives?.toLocaleString("id-ID") ?? "Belum tersedia"} />
                        <Row label="Konfigurasi pemulihan" value={data.drive.recoveryVerified ? "Terverifikasi" : "Belum terverifikasi"} />
                    </dl></section>
            </div>
            <section className={box}><h2 className="text-base font-semibold text-slate-900">Jadwal berikutnya</h2>
                <p className="mt-2 text-lg font-semibold text-slate-900">{backupDateTime(data.schedule.nextRunAt)}</p>
                <p className="mt-1 text-sm text-slate-500">{data.schedule.active ? "Jadwal backup aktif." : "Jadwal backup tidak aktif."}</p>
            </section>
            <p className="text-xs leading-6 text-slate-500">Data diperbarui {backupDateTime(data.generatedAt)}. Pemeriksaan halaman {backupDateTime(view.checkedAt)}. Halaman memeriksa pembaruan setiap satu menit saat terbuka.</p>
        </>}
    </div>;
}
