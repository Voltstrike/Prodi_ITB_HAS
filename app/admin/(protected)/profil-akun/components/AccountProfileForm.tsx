"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { isSuperAdminRole } from "@/lib/auth/roles";

type AccountProfile = {
    nama: string;
    email: string;
    role: string;
};

type ProfileResponse = {
    message?: string;
    requiresLogin?: boolean;
    account?: { nama: string; email: string };
};

const inputClassName =
    "mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50";

export default function AccountProfileForm({
    profile,
}: {
    profile: AccountProfile;
}) {
    const router = useRouter();
    const [nama, setNama] = useState(profile.nama);
    const [email, setEmail] = useState(profile.email);
    const [currentPassword, setCurrentPassword] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const emailChanged = email.trim().toLowerCase() !== profile.email;

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (saving) return;

        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch("/api/admin/profil-akun", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nama, email, currentPassword }),
            });

            const data: ProfileResponse = await response.json();

            if (data.requiresLogin === true) {
                setCurrentPassword("");
                router.replace("/admin/login");
                router.refresh();
                return;
            }

            if (!response.ok) {
                setError(data.message ?? "Gagal memperbarui profil akun.");
                return;
            }

            if (data.account) {
                setNama(data.account.nama);
                setEmail(data.account.email);
            }

            setCurrentPassword("");
            setSuccess(data.message ?? "Profil akun berhasil diperbarui.");
            router.refresh();
        } catch {
            setError("Terjadi kesalahan. Silakan coba lagi.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} aria-busy={saving} className="space-y-6">
            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-5">
                    <h2 className="font-semibold text-slate-900">
                        Informasi Akun
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Peran akun: {isSuperAdminRole(profile.role)
                            ? "Super Admin"
                            : "Administrator"}
                    </p>
                </div>

                <div className="space-y-5 p-6">
                    <div>
                        <label
                            htmlFor="profile-nama"
                            className="block text-sm font-medium text-slate-700"
                        >
                            Nama
                        </label>
                        <input
                            id="profile-nama"
                            name="nama"
                            autoComplete="name"
                            value={nama}
                            onChange={(event) => setNama(event.target.value)}
                            maxLength={200}
                            required
                            disabled={saving}
                            className={inputClassName}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="profile-email"
                            className="block text-sm font-medium text-slate-700"
                        >
                            Email untuk login
                        </label>
                        <input
                            id="profile-email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            maxLength={254}
                            required
                            disabled={saving}
                            className={inputClassName}
                        />
                    </div>

                    {emailChanged && (
                        <p
                            role="status"
                            className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
                        >
                            Setelah email diperbarui, Anda akan keluar dari semua
                            perangkat. Login kembali menggunakan email baru.
                        </p>
                    )}

                    <div>
                        <label
                            htmlFor="profile-password"
                            className="block text-sm font-medium text-slate-700"
                        >
                            Password saat ini
                        </label>
                        <input
                            id="profile-password"
                            name="currentPassword"
                            type="password"
                            autoComplete="current-password"
                            value={currentPassword}
                            onChange={(event) =>
                                setCurrentPassword(event.target.value)
                            }
                            maxLength={128}
                            required
                            disabled={saving}
                            aria-describedby="profile-password-help"
                            className={inputClassName}
                        />
                        <p
                            id="profile-password-help"
                            className="mt-2 text-sm text-slate-500"
                        >
                            Masukkan password saat ini untuk mengonfirmasi perubahan.
                        </p>
                    </div>
                </div>
            </section>

            {error && (
                <p
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                >
                    {error}
                </p>
            )}

            {success && (
                <p
                    role="status"
                    className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
                >
                    {success}
                </p>
            )}

            <div className="flex flex-wrap justify-end gap-3">
                <Link
                    href="/admin"
                    className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                    Kembali
                </Link>
                <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {saving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
            </div>
        </form>
    );
}
