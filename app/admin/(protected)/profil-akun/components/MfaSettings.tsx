"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type Setup = {
    secret: string;
    qrCodeDataUrl: string;
    expiresAt: string;
};

type Reply = {
    kind?: string;
    message?: string;
    requiresLogin?: boolean;
    enabled?: boolean;
    recoveryCodesRemaining?: number;
    recoveryCodes?: string[];
    secret?: string;
    qrCodeDataUrl?: string;
    expiresAt?: string;
};

type Action = "start" | "confirm" | "cancel" | "regenerate" | "disable";

const inputClass =
    "mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50";
const buttonClass =
    "rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50";
const secondaryClass =
    "rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50";

export default function MfaSettings({
    initialEnabled,
    initialRecoveryCodesRemaining,
}: {
    initialEnabled: boolean;
    initialRecoveryCodesRemaining: number;
}) {
    const router = useRouter();
    const [enabled, setEnabled] = useState(initialEnabled);
    const [remaining, setRemaining] = useState(initialRecoveryCodesRemaining);
    const [mode, setMode] = useState<"idle" | "regenerate" | "disable">("idle");
    const [setup, setSetup] = useState<Setup | null>(null);
    const [password, setPassword] = useState("");
    const [code, setCode] = useState("");
    const [useRecoveryCode, setUseRecoveryCode] = useState(false);
    const [codes, setCodes] = useState<string[]>([]);
    const [saved, setSaved] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    function clearForm() {
        setSetup(null);
        setMode("idle");
        setPassword("");
        setCode("");
        setUseRecoveryCode(false);
    }

    function loginAgain() {
        clearForm();
        setCodes([]);
        router.replace("/admin/login");
        router.refresh();
    }

    async function syncStatus() {
        const response = await fetch("/api/admin/mfa", { cache: "no-store" });
        const data: Reply = await response.json().catch(() => ({}));

        if (data.requiresLogin) {
            loginAgain();
            return;
        }

        if (
            !response.ok ||
            typeof data.enabled !== "boolean" ||
            !Number.isInteger(data.recoveryCodesRemaining)
        ) {
            throw new Error("Status tidak tersedia.");
        }

        setEnabled(data.enabled);
        setRemaining(data.recoveryCodesRemaining!);
        clearForm();
        setCodes([]);
        router.refresh();
    }

    async function perform(action: Action) {
        if (busy) return;

        setBusy(true);
        setError("");
        setNotice("");

        try {
            const response = await fetch("/api/admin/mfa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action,
                    currentPassword: password,
                    ...(["confirm", "regenerate", "disable"].includes(action)
                        ? {
                            mfaCode: code.trim(),
                            useRecoveryCode: setup ? false : useRecoveryCode,
                        }
                        : {}),
                }),
            });

            const data: Reply = await response.json().catch(() => ({}));

            if (data.requiresLogin) {
                loginAgain();
                return;
            }

            if (!response.ok) {
                setError(data.message ?? "Pengaturan MFA gagal diproses.");
                if (response.status === 410) clearForm();

                if (response.status === 409 || response.status >= 500) {
                    try {
                        await syncStatus();
                    } catch {
                        // Tampilkan pesan awal.
                    }
                }
                return;
            }

            if (data.kind === "setup") {
                if (
                    typeof data.secret !== "string" ||
                    !/^[A-Z2-7]{32}$/.test(data.secret) ||
                    typeof data.qrCodeDataUrl !== "string" ||
                    !data.qrCodeDataUrl.startsWith("data:image/png;base64,") ||
                    typeof data.expiresAt !== "string"
                ) {
                    throw new Error("Respons setup tidak valid.");
                }

                setSetup({
                    secret: data.secret,
                    qrCodeDataUrl: data.qrCodeDataUrl,
                    expiresAt: data.expiresAt,
                });
                setCode("");
                setUseRecoveryCode(false);
            } else {
                if (typeof data.enabled !== "boolean") {
                    throw new Error("Respons tidak valid.");
                }

                setEnabled(data.enabled);
                if (typeof data.recoveryCodesRemaining === "number") {
                    setRemaining(data.recoveryCodesRemaining);
                }

                if (data.kind === "enabled" || data.kind === "regenerated") {
                    if (
                        !Array.isArray(data.recoveryCodes) ||
                        data.recoveryCodes.length !== 10 ||
                        !data.recoveryCodes.every((value) =>
                            typeof value === "string" &&
                            /^[A-F0-9]{8}(?:-[A-F0-9]{8}){3}$/.test(value))
                    ) {
                        throw new Error("Respons kode pemulihan tidak valid.");
                    }

                    setCodes(data.recoveryCodes);
                    setSaved(false);
                }

                clearForm();
                router.refresh();
            }

            setNotice(data.message ?? "Pengaturan MFA tersimpan.");
        } catch {
            try {
                await syncStatus();
            } catch {
                // Status dapat diperbarui setelah koneksi pulih.
            }

            setError(
                "Koneksi atau respons terputus. Periksa status MFA sebelum mengulangi tindakan. Jika kode pemulihan belum tersimpan, buat ulang setelah login.",
            );
        } finally {
            setBusy(false);
        }
    }

    async function refreshStatus() {
        if (busy) return;
        setBusy(true);
        setError("");

        try {
            await syncStatus();
        } catch {
            setError("Status belum dapat dibaca. Periksa koneksi lalu coba lagi.");
        } finally {
            setBusy(false);
        }
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        void perform(setup ? "confirm" : mode === "idle" ? "start" : mode);
    }

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900">
                Verifikasi dua langkah (MFA)
            </h2>
            <p className="mt-2 text-sm text-slate-600">
                {enabled
                    ? `Aktif. Kode pemulihan tersisa: ${remaining}.`
                    : "Tambahkan kode dari aplikasi autentikator saat login ke akun Anda."}
            </p>

            {notice && (
                <p role="status" className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">
                    {notice}
                </p>
            )}

            {error && (
                <div className="mt-4 space-y-3">
                    <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
                        {error}
                    </p>
                    {codes.length === 0 && (
                        <button type="button" disabled={busy} onClick={() => void refreshStatus()} className={secondaryClass}>
                            Perbarui status
                        </button>
                    )}
                </div>
            )}

            {codes.length > 0 ? (
                <div className="mt-5 space-y-4">
                    <h3 className="font-medium text-slate-900">Simpan kode pemulihan</h3>
                    <p className="text-sm text-slate-600">
                        Kode ini hanya ditampilkan sekarang. Setiap kode dapat dipakai satu kali. Simpan di tempat aman.
                    </p>
                    <ul className="space-y-2 rounded-lg bg-slate-50 p-4 font-mono text-xs text-slate-900 sm:text-sm">
                        {codes.map((value) => (
                            <li key={value} className="break-all select-all">{value}</li>
                        ))}
                    </ul>
                    <button
                        type="button"
                        className={secondaryClass}
                        onClick={async () => {
                            setError("");
                            try {
                                await navigator.clipboard.writeText(codes.join("\n"));
                                setNotice("Kode disalin. Simpan di tempat aman.");
                            } catch {
                                setError("Penyalinan otomatis gagal. Pilih dan salin kode secara manual.");
                            }
                        }}
                    >
                        Salin kode
                    </button>
                    <label className="flex items-start gap-3 text-sm text-slate-700">
                        <input type="checkbox" checked={saved} onChange={(event) => setSaved(event.target.checked)} className="mt-1" />
                        Saya sudah menyimpan kode pemulihan.
                    </label>
                    <button
                        type="button"
                        disabled={!saved}
                        className={buttonClass}
                        onClick={() => {
                            setCodes([]);
                            setSaved(false);
                            setNotice("Kode pemulihan telah ditutup.");
                        }}
                    >
                        Selesai
                    </button>
                </div>
            ) : enabled && mode === "idle" && !setup ? (
                <div className="mt-5 flex flex-wrap gap-3">
                    <button
                        type="button"
                        className={secondaryClass}
                        onClick={() => {
                            clearForm();
                            setMode("regenerate");
                            setError("");
                            setNotice("");
                        }}
                    >
                        Buat ulang kode pemulihan
                    </button>
                    <button
                        type="button"
                        className={secondaryClass}
                        onClick={() => {
                            clearForm();
                            setMode("disable");
                            setError("");
                            setNotice("");
                        }}
                    >
                        Nonaktifkan MFA
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} aria-busy={busy} className="mt-5 space-y-5">
                    {setup && (
                        <div className="space-y-3 rounded-lg bg-slate-50 p-4">
                            <p className="text-sm text-slate-700">
                                Pindai QR dengan aplikasi autentikator. Pengaturan berlaku selama 10 menit.
                            </p>
                            <Image
                                src={setup.qrCodeDataUrl}
                                width={256}
                                height={256}
                                unoptimized
                                alt="QR untuk menambahkan akun ke aplikasi autentikator"
                            />
                            <p className="text-sm text-slate-600">
                                Jika tidak bisa memindai, masukkan kunci ini secara manual:
                            </p>
                            <code className="block break-all select-all text-sm text-slate-900">
                                {setup.secret}
                            </code>
                        </div>
                    )}

                    {mode === "disable" && (
                        <p className="text-sm text-amber-800">
                            Setelah MFA dinonaktifkan, login hanya memerlukan password. Sesi lain akan dicabut.
                        </p>
                    )}
                    {mode === "regenerate" && (
                        <p className="text-sm text-slate-600">
                            Kode pemulihan lama akan diganti dan sesi lain akan dicabut.
                        </p>
                    )}

                    <div>
                        <label htmlFor="mfa-current-password" className="block text-sm font-medium text-slate-700">
                            Password saat ini
                        </label>
                        <input
                            id="mfa-current-password"
                            type="password"
                            autoComplete="current-password"
                            required
                            maxLength={128}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            disabled={busy}
                            className={inputClass}
                        />
                    </div>

                    {(setup || mode !== "idle") && (
                        <div>
                            <label htmlFor="mfa-settings-code" className="block text-sm font-medium text-slate-700">
                                {!setup && useRecoveryCode ? "Kode pemulihan" : "Kode autentikator"}
                            </label>
                            <input
                                id="mfa-settings-code"
                                type="text"
                                inputMode={!setup && useRecoveryCode ? "text" : "numeric"}
                                autoComplete={!setup && useRecoveryCode ? "off" : "one-time-code"}
                                spellCheck={false}
                                required
                                pattern={!setup && useRecoveryCode ? undefined : "[0-9]{6}"}
                                maxLength={!setup && useRecoveryCode ? 64 : 6}
                                value={code}
                                onChange={(event) => setCode(event.target.value)}
                                disabled={busy}
                                className={inputClass}
                            />
                            {!setup && (
                                <button
                                    type="button"
                                    disabled={busy}
                                    className="mt-2 rounded text-sm text-blue-700 hover:underline"
                                    onClick={() => {
                                        setUseRecoveryCode((value) => !value);
                                        setCode("");
                                        setError("");
                                    }}
                                >
                                    {useRecoveryCode ? "Gunakan aplikasi autentikator" : "Gunakan kode pemulihan"}
                                </button>
                            )}
                        </div>
                    )}

                    <div className="flex flex-wrap gap-3">
                        <button type="submit" disabled={busy} className={buttonClass}>
                            {busy ? "Memproses..."
                                : setup ? "Konfirmasi aktivasi MFA"
                                : mode === "disable" ? "Nonaktifkan MFA"
                                : mode === "regenerate" ? "Buat kode pemulihan baru"
                                : "Mulai aktivasi MFA"}
                        </button>
                        {(setup || mode !== "idle") && (
                            <button
                                type="button"
                                disabled={busy}
                                className={secondaryClass}
                                onClick={() => {
                                    if (setup) void perform("cancel");
                                    else {
                                        clearForm();
                                        setError("");
                                        setNotice("");
                                    }
                                }}
                            >
                                Batal
                            </button>
                        )}
                    </div>
                </form>
            )}
        </section>
    );
}
