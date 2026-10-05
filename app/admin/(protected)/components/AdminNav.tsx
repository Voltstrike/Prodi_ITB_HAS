"use client";

import Link from "next/link";
import { useState } from "react";
import LogoutButton from "./LogoutButton";

export default function AdminNav() {
    const [open, setOpen] = useState(false);

    function closeMenu() {
        setOpen(false);
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
                className={`fixed inset-y-0 left-0 z-50 w-72 transform border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:min-h-screen lg:w-64 lg:translate-x-0 ${
                    open ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="flex h-full flex-col">
                    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
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

                    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
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
                                <Link href="/admin/profil" onClick={closeMenu} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-700">Profil</Link>
                                <Link href="/admin/dosen" onClick={closeMenu} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-700">Dosen</Link>
                                <Link href="/admin/staff" onClick={closeMenu} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-700">Staff</Link>
                                <Link href="/admin/berita" onClick={closeMenu} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-700">Berita</Link>
                            </div>
                        </div>

                        <div className="pt-4">
                            <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Akademik
                            </p>

                            <div className="flex flex-col gap-1">
                                <Link href="/admin/kurikulum" onClick={closeMenu} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-700">Kurikulum</Link>
                                <Link href="/admin/kalender-akademik" onClick={closeMenu} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-700">Kalender Akademik</Link>
                                <Link href="/admin/informasi-akademik" onClick={closeMenu} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-700">Informasi Akademik</Link>
                            </div>
                        </div>

                        <div className="mt-auto border-t border-slate-200 pt-4">
                            <LogoutButton />
                        </div>
                    </nav>
                </div>
            </aside>
        </>
    );
}