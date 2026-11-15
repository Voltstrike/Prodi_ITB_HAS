"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SessionBrowser, type BrowserSession, type SessionView } from "@/lib/auth/session-browser";

function SessionWarning({ view, onContinue }: { view: SessionView; onContinue: () => void }) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const id = useId();
    useEffect(() => {
        const dialog = dialogRef.current;
        if (dialog && !dialog.open) dialog.showModal();
        return () => { if (dialog?.open) dialog.close(); };
    }, []);
    const seconds = view.seconds ?? 0;
    const countdown = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

    return <dialog ref={dialogRef} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}
        onCancel={(event) => event.preventDefault()}
        className="m-auto w-[calc(100%_-_2rem)] max-w-md rounded-xl border-0 bg-white p-6 text-slate-900 shadow-xl backdrop:bg-slate-900/60">
        <h2 id={`${id}-title`} className="text-lg font-semibold">
            {seconds > 0 ? "Sesi akan segera berakhir" : "Memeriksa sesi"}
        </h2>
        <p id={`${id}-description`} className="mt-3 text-sm leading-6 text-slate-600">
            {view.absolute
                ? "Batas maksimal sesi delapan jam akan tercapai. Simpan pekerjaan Anda dan login kembali."
                : "Tidak ada aktivitas selama beberapa waktu. Pilih Tetap masuk untuk melanjutkan pekerjaan."}
        </p>
        <p aria-live="off" className="my-5 text-center text-3xl font-semibold tabular-nums">{countdown}</p>
        {view.unavailable && <p role="status" className="mb-4 text-sm text-amber-800">
            Koneksi ke server belum tersedia. Pekerjaan Anda tetap di halaman ini; coba periksa sesi kembali.
        </p>}
        {view.absolute && seconds > 0 ? <button type="button"
            onClick={() => window.location.replace("/admin/login")}
            className="w-full rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white">
            Ke halaman login
        </button> : <button type="button" disabled={view.busy} onClick={onContinue}
            className="w-full rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
            {view.busy ? "Memeriksa..." : seconds > 0 ? "Tetap masuk" : "Periksa sesi kembali"}
        </button>}
    </dialog>;
}

export default function AdminSessionGuard({ initial }: { initial: BrowserSession }) {
    const router = useRouter();
    const tracker = useRef<SessionBrowser | null>(null);
    const [view, setView] = useState<SessionView>({
        seconds: null, absolute: false, busy: false, unavailable: false, changed: false,
    });

    useEffect(() => {
        const controller = new AbortController();
        const current = new SessionBrowser(initial, {
            now: Date.now,
            request: (sessionId) => fetch("/api/auth/session", {
                method: sessionId === undefined ? "GET" : "POST",
                credentials: "same-origin",
                cache: "no-store",
                signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10_000)]),
                ...(sessionId === undefined ? {} : {
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ sessionId }),
                }),
            }),
            render: setView,
            expired: () => window.location.replace("/admin/login"),
            changed: () => router.refresh(),
        });
        tracker.current = current;
        const activity = (event: Event) => {
            if (event.isTrusted && document.visibilityState === "visible") current.activity();
        };
        const check = () => {
            if (document.visibilityState === "visible") current.check();
        };
        const events = ["keydown", "input", "pointerdown", "pointermove", "wheel", "touchstart"];
        for (const event of events) window.addEventListener(event, activity, { passive: true });
        for (const event of ["focus", "online", "pageshow"]) window.addEventListener(event, check);
        document.addEventListener("visibilitychange", check);
        const timer = window.setInterval(() => current.tick(), 1000);
        current.check();
        return () => {
            current.dispose();
            controller.abort();
            window.clearInterval(timer);
            for (const event of events) window.removeEventListener(event, activity);
            for (const event of ["focus", "online", "pageshow"]) window.removeEventListener(event, check);
            document.removeEventListener("visibilitychange", check);
            tracker.current = null;
        };
    }, [initial, router]);

    if (view.changed) return <div role="status" className="fixed inset-x-4 bottom-4 z-50 rounded-lg border border-blue-200 bg-white p-4 text-sm shadow-lg">
        Sesi telah berubah. Memperbarui halaman admin…{" "}
        <button type="button" className="font-semibold text-blue-700 underline" onClick={() => router.refresh()}>Perbarui sesi</button>
    </div>;

    return <>
        {view.seconds !== null && <SessionWarning view={view} onContinue={() => {
            if (view.seconds === 0 || view.unavailable) tracker.current?.check();
            else tracker.current?.activity();
        }} />}
        {view.seconds === null && view.unavailable && <div role="status"
            className="fixed inset-x-4 bottom-4 z-50 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-lg">
            Status sesi belum bisa diperiksa. Periksa koneksi internet Anda.
        </div>}
    </>;
}
