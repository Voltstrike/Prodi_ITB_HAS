"use client";

import {
    Fragment,
    useEffect,
    useRef,
    useState,
    useTransition,
    type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { validateAccountPassword } from "@/lib/admin/accounts";
import type { toAccountDto } from "@/lib/admin/accounts";

type Account = ReturnType<typeof toAccountDto>;
type AccountAction =
    | { action: "set-active"; isActive: boolean }
    | { action: "reset-password"; password: string };

const passwordFields = [
    { name: "password", label: "Password Baru" },
    { name: "confirm", label: "Ulangi Password" },
];

export default function AccountTable({
    accounts,
    currentUserId,
}: {
    accounts: Account[];
    currentUserId: number;
}) {
    const router = useRouter();
    const [busyId, setBusyId] = useState<number | null>(null);
    const [refreshing, startTransition] = useTransition();
    const [resetId, setResetId] = useState<number | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const passwordRef = useRef<HTMLInputElement>(null);
    const busy = busyId !== null || refreshing;

    useEffect(() => {
        if (resetId !== null) passwordRef.current?.focus();
    }, [resetId]);

    function canManage(account: Account) {
        return account.id !== currentUserId && account.role === "ADMIN";
    }

    function openReset(account: Account) {
        if (busy || !canManage(account)) return;
        setError("");
        setSuccess("");
        setShowPassword(false);
        setResetId(account.id);
    }

    function closeReset(accountId: number) {
        if (busy) return;
        document.getElementById(`reset-trigger-${accountId}`)?.focus();
        setResetId(null);
        setShowPassword(false);
        setError("");
    }

    async function changeAccount(
        account: Account,
        action: AccountAction,
    ): Promise<boolean> {
        if (busy || !canManage(account)) return false;
        setBusyId(account.id);
        setError("");
        setSuccess("");

        try {
            const response = await fetch(`/api/admin/akun/${account.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(action),
            });
            const data: unknown = await response.json().catch(() => null);

            if (!response.ok) {
                const message =
                    data && typeof data === "object" &&
                    "message" in data && typeof data.message === "string"
                        ? data.message
                        : "Gagal mengubah akun.";
                setError(message);
                return false;
            }

            startTransition(() => router.refresh());
            return true;
        } catch {
            setError("Tidak dapat terhubung ke server. Silakan coba lagi.");
            return false;
        } finally {
            setBusyId(null);
        }
    }

    async function toggleStatus(account: Account) {
        if (busy || !canManage(account)) return;
        if (
            account.isActive &&
            !window.confirm(
                `Nonaktifkan akun ${account.email}? Pengguna akan keluar dari semua sesi.`,
            )
        ) {
            return;
        }

        const changed = await changeAccount(account, {
            action: "set-active",
            isActive: !account.isActive,
        });

        if (changed) {
            if (resetId === account.id) setResetId(null);
            setSuccess(
                `Akun ${account.email} berhasil ${account.isActive ? "dinonaktifkan" : "diaktifkan"}.`,
            );
        }
    }

    async function resetPassword(
        event: FormEvent<HTMLFormElement>,
        account: Account,
    ) {
        event.preventDefault();
        if (busy || !canManage(account)) return;

        const form = event.currentTarget;
        const fields = new FormData(form);
        const password = String(fields.get("password") ?? "");
        const confirm = String(fields.get("confirm") ?? "");

        setError("");
        setSuccess("");

        const invalid = validateAccountPassword(password);
        if (invalid) {
            setError(invalid);
            return;
        }
        if (password !== confirm) {
            setError("Konfirmasi password tidak cocok.");
            return;
        }

        const changed = await changeAccount(account, {
            action: "reset-password",
            password,
        });

        if (changed) {
            form.reset();
            setResetId(null);
            setShowPassword(false);
            setSuccess(
                `Password akun ${account.email} berhasil direset. Sesi sebelumnya telah dicabut.`,
            );
        }
    }

    const buttonClass =
        "rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-50";

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="font-semibold text-slate-900">Daftar Akun</h2>

            {error && (
                <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </p>
            )}
            {success && (
                <p role="status" className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {success}
                </p>
            )}

            <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                    <caption className="sr-only">Daftar akun administrator</caption>
                    <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                        <tr>
                            {["Nama", "Email", "Peran", "Status", "Aksi"].map((heading) => (
                                <th key={heading} scope="col" className="px-3 py-3 font-semibold">
                                    {heading}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {accounts.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                                    Belum ada akun.
                                </td>
                            </tr>
                        )}

                        {accounts.map((account) => (
                            <Fragment key={account.id}>
                                <tr className="border-b border-slate-100">
                                    <td className="max-w-64 break-words px-3 py-4 font-medium text-slate-900">
                                        {account.nama}
                                    </td>
                                    <td className="max-w-72 break-words px-3 py-4 text-slate-600">
                                        {account.email}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-slate-600">
                                        {account.role === "SUPER_ADMIN"
                                            ? "Super Admin"
                                            : account.role === "ADMIN" ? "Admin" : account.role}
                                    </td>
                                    <td className="px-3 py-4">
                                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                                            account.isActive
                                                ? "bg-emerald-50 text-emerald-700"
                                                : "bg-slate-100 text-slate-500"
                                        }`}>
                                            {account.isActive ? "Aktif" : "Nonaktif"}
                                        </span>
                                    </td>
                                    <td className="px-3 py-4">
                                        {canManage(account) ? (
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    disabled={busy}
                                                    onClick={() => void toggleStatus(account)}
                                                    className={`${buttonClass} text-slate-700`}
                                                    aria-label={`${account.isActive ? "Nonaktifkan" : "Aktifkan"} akun ${account.email}`}
                                                >
                                                    {account.isActive ? "Nonaktifkan" : "Aktifkan"}
                                                </button>
                                                <button
                                                    id={`reset-trigger-${account.id}`}
                                                    type="button"
                                                    disabled={busy}
                                                    onClick={() => openReset(account)}
                                                    className={`${buttonClass} text-blue-700`}
                                                    aria-label={`Reset password akun ${account.email}`}
                                                    aria-expanded={resetId === account.id}
                                                    aria-controls={`reset-panel-${account.id}`}
                                                >
                                                    Reset Password
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-400">
                                                {account.id === currentUserId ? "Akun Anda" : "Dilindungi"}
                                            </span>
                                        )}
                                    </td>
                                </tr>

                                {resetId === account.id && canManage(account) && (
                                    <tr>
                                        <td colSpan={5} className="bg-slate-50 p-4">
                                            <form
                                                id={`reset-panel-${account.id}`}
                                                onSubmit={(event) => void resetPassword(event, account)}
                                                className="rounded-lg border border-slate-200 bg-white p-4"
                                            >
                                                <h3 className="font-semibold text-slate-900">
                                                    Reset Password: {account.nama}
                                                </h3>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    Password lama akan diganti dan akun keluar dari semua sesi.
                                                </p>
                                                <fieldset disabled={busy} className="mt-4 space-y-4">
                                                    <div className="grid gap-4 md:grid-cols-2">
                                                        {passwordFields.map((field) => (
                                                            <div key={field.name}>
                                                                <label
                                                                    htmlFor={`reset-${account.id}-${field.name}`}
                                                                    className="text-sm font-medium text-slate-700"
                                                                >
                                                                    {field.label}
                                                                </label>
                                                                <input
                                                                    ref={field.name === "password" ? passwordRef : undefined}
                                                                    id={`reset-${account.id}-${field.name}`}
                                                                    name={field.name}
                                                                    type={showPassword ? "text" : "password"}
                                                                    required
                                                                    minLength={12}
                                                                    maxLength={128}
                                                                    autoComplete="new-password"
                                                                    className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <label className="flex items-center gap-2 text-sm text-slate-600">
                                                        <input
                                                            type="checkbox"
                                                            checked={showPassword}
                                                            onChange={(event) => setShowPassword(event.target.checked)}
                                                            className="h-4 w-4 accent-blue-700"
                                                        />
                                                        Tampilkan password
                                                    </label>
                                                    <div className="flex gap-2">
                                                        <button
                                                            type="submit"
                                                            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:opacity-50"
                                                        >
                                                            {busyId === account.id ? "Memproses..." : "Simpan Password"}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => closeReset(account.id)}
                                                            className={`${buttonClass} text-slate-600`}
                                                        >
                                                            Batal
                                                        </button>
                                                    </div>
                                                </fieldset>
                                            </form>
                                        </td>
                                    </tr>
                                )}
                            </Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
