"use client";

import { useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="border-b border-slate-100 bg-[#1E3A8A]">
      <nav className="mx-auto max-w-6xl px-6">
        <div className="flex h-20 items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-sm font-bold text-[#1E3A8A]">
              MM
            </div>

            <div>
              <p className="text-sm font-bold leading-tight text-white">
                Magister Manajemen
              </p>

              <p className="text-xs text-blue-200">
                ITB Haji Agus Salim
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-7 md:flex">
            <Link
              href="/"
              className="text-sm font-medium text-white transition hover:text-blue-200"
            >
              Beranda
            </Link>

            <Link
              href="/profil"
              className="text-sm text-blue-100 transition hover:text-white"
            >
              Profil
            </Link>

            <Link
              href="/akademik"
              className="text-sm text-blue-100 transition hover:text-white"
            >
              Akademik
            </Link>

            <Link
              href="/dosen"
              className="text-sm text-blue-100 transition hover:text-white"
            >
              Dosen & Staff
            </Link>

            <Link
              href="/berita"
              className="text-sm text-blue-100 transition hover:text-white"
            >
              Berita
            </Link>
          </div>

          {/* Desktop CTA */}
          <Link
            href="/pendaftaran"
            className="hidden rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-[#1E3A8A] transition hover:bg-blue-100 md:block"
          >
            Pendaftaran
          </Link>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-lg p-2 text-white transition hover:bg-blue-800 md:hidden"
            aria-label="Buka menu navigasi"
            aria-expanded={isOpen}
          >
            <span className="text-2xl">
              {isOpen ? "×" : "☰"}
            </span>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="border-t border-blue-800 py-4 md:hidden">
            <div className="flex flex-col gap-1">
              <Link onClick={() => setIsOpen(false)}
                href="/"
                className="rounded-lg px-4 py-3 text-sm text-white transition hover:bg-blue-800"
              >
                Beranda
              </Link>

              <Link onClick={() => setIsOpen(false)}
                href="/profil"
                className="rounded-lg px-4 py-3 text-sm text-blue-100 transition hover:bg-blue-800 hover:text-white"
              >
                Profil
              </Link>

              <Link onClick={() => setIsOpen(false)}
                href="/akademik"
                className="rounded-lg px-4 py-3 text-sm text-blue-100 transition hover:bg-blue-800 hover:text-white"
              >
                Akademik
              </Link>

              <Link onClick={() => setIsOpen(false)}
                href="/dosen"
                className="rounded-lg px-4 py-3 text-sm text-blue-100 transition hover:bg-blue-800 hover:text-white"
              >
                Dosen & Staff
              </Link>

              <Link onClick={() => setIsOpen(false)}
                href="/berita"
                className="rounded-lg px-4 py-3 text-sm text-blue-100 transition hover:bg-blue-800 hover:text-white"
              >
                Berita
              </Link>

              <Link onClick={() => setIsOpen(false)}
                href="/pendaftaran"
                className="mt-2 rounded-lg bg-white px-4 py-3 text-center text-sm font-medium text-[#1E3A8A] transition hover:bg-blue-100"
              >
                Pendaftaran
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}