"use client";

import Link from "next/link";
import { isSuperAdminRole } from "@/lib/auth/roles";
import { useState } from "react";
import LogoutButton from "./LogoutButton";

type AdminUser = {
    nama: string;
    email: string;
    role: string;
};

export default function AdminNav({ user }: { user: AdminUser }) {
    const [open, setOpen] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);

    function closeMenu() {
        setOpen(false);
        setAccountOpen(false);
    }

    return (
        <>
            {/* Mobile header */}
            <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4 lg:hidden">
                <Link
                    href="/admin"
                    className="text-base font-bold text-slate-900"
                    onClick={closeMenu}
                >
                    Admin Magister Manajemen
                </Link>

                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-100"
                    aria-label="Buka menu"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.8}
                        stroke="currentColor"
                        className="h-6 w-6"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"
                        />
                    </svg>
                </button>
            </header>

            {/* Mobile overlay */}
            {open && (
                <button
                    type="button"
                    aria-label="Tutup menu"
                    onClick={closeMenu}
                    className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-72 transform flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:min-h-screen lg:w-64 lg:translate-x-0 ${
                    open ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                {/* Sidebar header */}
                <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-5">
                    <Link
                        href="/admin"
                        className="text-lg font-bold text-slate-900"
                        onClick={closeMenu}
                    >
                        Admin Magister Manajemen
                    </Link>

                    <button
                        type="button"
                        onClick={closeMenu}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
                        aria-label="Tutup menu"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.8}
                            stroke="currentColor"
                            className="h-5 w-5"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18 18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-4">
                    <div className="flex flex-col gap-1">
                        <Link
                            href="/admin"
                            onClick={closeMenu}
                            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-700"
                        >
                            Dashboard
                        </Link>

                        <div className="pt-4">
                            <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Konten
                            </p>

                            <div className="flex flex-col gap-1">
                                <Link
                                    href="/admin/profil"
                                    onClick={closeMenu}
                                    className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-700"
                                >
                                    Profil
                                </Link>

                                <Link
                                    href="/admin/dosen"
                                    onClick={closeMenu}
                                    className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-700"
                                >
                                    Dosen
                                </Link>

                                <Link
                                    href="/admin/staff"
                                    onClick={closeMenu}
                                    className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-700"
                                >
                                    Staff
                                </Link>

                                <Link
                                    href="/admin/berita"
                                    onClick={closeMenu}
                                    className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-700"
                                >
                                    Berita
                                </Link>
                            </div>
                        </div>

                        <div className="pt-4">
                            <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Akademik
                            </p>

                            <div className="flex flex-col gap-1">
                                <Link
                                    href="/admin/kurikulum"
                                    onClick={closeMenu}
                                    className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-700"
                                >
                                    Kurikulum
                                </Link>

                                <Link
                                    href="/admin/kalender-akademik"
                                    onClick={closeMenu}
                                    className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-700"
                                >
                                    Kalender Akademik
                                </Link>

                                <Link
                                    href="/admin/informasi-akademik"
                                    onClick={closeMenu}
                                    className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-700"
                                >
                                    Informasi Akademik
                                </Link>
                            </div>
                        </div>
                        {isSuperAdminRole(user.role) && (
                            <div className="pt-4">
                                <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    Pengaturan
                                </p>
                                <Link
                                    href="/admin/akun"
                                    onClick={closeMenu}
                                    className="block rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-700"
                                >
                                    Kelola Akun
                                </Link>
                            </div>
                        )}
                    </div>
                </nav>

                {/* Account / Logout */}
                <div className="shrink-0 border-t border-slate-200 p-3">
                    <div className="relative">
                        {accountOpen && (
                            <>
                                <button
                                    type="button"
                                    aria-label="Tutup menu akun"
                                    onClick={() => setAccountOpen(false)}
                                    className="fixed inset-0 z-40 cursor-default"
                                />

                                <div className="absolute bottom-full left-0 right-0 z-50 mb-2 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                                    <div className="border-b border-slate-100 px-3 py-3">
                                        <p className="text-sm font-semibold text-slate-900">
                                            {user.nama}
                                        </p>

                                        <p className="mt-1 truncate text-xs text-slate-500">
                                            {user.email}
                                        </p>
                                    </div>

                                    <Link
                                        href="/admin/profil-akun"
                                        onClick={() => setAccountOpen(false)}
                                        className="mt-1 block rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                                    >
                                        Edit Profil
                                    </Link>

                                    <div className="rounded-lg px-3 py-2.5">
                                        <LogoutButton />
                                    </div>
                                </div>
                            </>
                        )}

                        <button
                            type="button"
                            onClick={() => setAccountOpen((value) => !value)}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-slate-100"
                        >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
                                {user.nama.charAt(0).toUpperCase()}
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-slate-900">
                                    {user.nama}
                                </p>

                                <p className="text-xs text-slate-500">
                                    {isSuperAdminRole(user.role) ? "Super Admin" : "Administrator"}
                                </p>
                            </div>

                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.8}
                                stroke="currentColor"
                                className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                                    accountOpen ? "rotate-180" : ""
                                }`}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="m6.75 9 5.25 5.25L17.25 9"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}