"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
    validateAccount,
    validateAccountPassword,
} from "@/lib/admin/accounts";

export default function CreateAccountForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (loading) return;

        const form = event.currentTarget;
        const fields = new FormData(form);
        const nama = String(fields.get("nama") ?? "").trim();
        const email = String(fields.get("email") ?? "").trim().toLowerCase();
        const password = String(fields.get("password") ?? "");
        const confirm = String(fields.get("confirm") ?? "");

        setError("");
        setSuccess("");

        const validation =
            validateAccount(nama, email) ??
            validateAccountPassword(password);

        if (validation) {
            setError(validation);
            return;
        }
        if (password !== confirm) {
            setError("Konfirmasi password tidak cocok.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/api/admin/akun", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nama, email, password }),
            });
            const data: unknown = await response.json().catch(() => null);

            if (!response.ok) {
                const message =
                    data && typeof data === "object" &&
                    "message" in data && typeof data.message === "string"
                        ? data.message
                        : "Gagal membuat akun.";
                setError(message);
                return;
            }

            form.reset();
            setShowPassword(false);
            setSuccess(`Akun ${email} berhasil dibuat.`);
            router.refresh();
        } catch {
            setError("Tidak dapat terhubung ke server. Silakan coba lagi.");
        } finally {
            setLoading(false);
        }
    }

    const inputClass =
        "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

    return (
        <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-slate-200 bg-white p-6"
        >
            <h2 className="font-semibold text-slate-900">Tambah Akun Admin</h2>
            <p className="mt-1 text-sm text-slate-500">
                Akun baru memiliki peran Admin untuk mengelola konten website.
            </p>

            <fieldset disabled={loading} className="mt-5 space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                    <div>
                        <label htmlFor="account-nama" className="text-sm font-medium text-slate-700">
                            Nama
                        </label>
                        <input
                            id="account-nama"
                            name="nama"
                            required
                            maxLength={200}
                            autoComplete="off"
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label htmlFor="account-email" className="text-sm font-medium text-slate-700">
                            Email
                        </label>
                        <input
                            id="account-email"
                            name="email"
                            type="email"
                            required
                            maxLength={254}
                            autoComplete="off"
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <label htmlFor="account-password" className="text-sm font-medium text-slate-700">
                            Password
                        </label>
                        <input
                            id="account-password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            required
                            minLength={12}
                            maxLength={128}
                            autoComplete="new-password"
                            className={inputClass}
                        />
                        <p className="mt-1 text-xs text-slate-500">
                            Gunakan 12–128 karakter.
                        </p>
                    </div>

                    <div>
                        <label htmlFor="account-confirm" className="text-sm font-medium text-slate-700">
                            Ulangi Password
                        </label>
                        <input
                            id="account-confirm"
                            name="confirm"
                            type={showPassword ? "text" : "password"}
                            required
                            minLength={12}
                            maxLength={128}
                            autoComplete="new-password"
                            className={inputClass}
                        />
                    </div>
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

                <button
                    type="submit"
                    className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {loading ? "Menyimpan..." : "Buat Akun"}
                </button>
            </fieldset>

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
        </form>
    );
}
