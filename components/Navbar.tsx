"use client";

import { useState } from "react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="border-b border-slate-100 bg-[#1E3A8A]">
      <nav className="mx-auto max-w-6xl px-6">
        <div className="flex h-20 items-center justify-between">

          {/* Logo */}
          <a href="/" className="flex items-center gap-3">
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
          </a>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-7 md:flex">
            <a
              href="/"
              className="text-sm font-medium text-white transition hover:text-blue-200"
            >
              Beranda
            </a>

            <a
              href="/profil"
              className="text-sm text-blue-100 transition hover:text-white"
            >
              Profil
            </a>

            <a
              href="/akademik"
              className="text-sm text-blue-100 transition hover:text-white"
            >
              Akademik
            </a>

            <a
              href="/dosen"
              className="text-sm text-blue-100 transition hover:text-white"
            >
              Dosen & Staff
            </a>

            <a
              href="/berita"
              className="text-sm text-blue-100 transition hover:text-white"
            >
              Berita
            </a>
          </div>

          {/* Desktop CTA */}
          <a
            href="/pendaftaran"
            className="hidden rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-[#1E3A8A] transition hover:bg-blue-100 md:block"
          >
            Pendaftaran
          </a>

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
              <a
                href="/"
                className="rounded-lg px-4 py-3 text-sm text-white transition hover:bg-blue-800"
              >
                Beranda
              </a>

              <a
                href="/profil"
                className="rounded-lg px-4 py-3 text-sm text-blue-100 transition hover:bg-blue-800 hover:text-white"
              >
                Profil
              </a>

              <a
                href="/akademik"
                className="rounded-lg px-4 py-3 text-sm text-blue-100 transition hover:bg-blue-800 hover:text-white"
              >
                Akademik
              </a>

              <a
                href="/dosen"
                className="rounded-lg px-4 py-3 text-sm text-blue-100 transition hover:bg-blue-800 hover:text-white"
              >
                Dosen & Staff
              </a>

              <a
                href="/berita"
                className="rounded-lg px-4 py-3 text-sm text-blue-100 transition hover:bg-blue-800 hover:text-white"
              >
                Berita
              </a>

              <a
                href="/pendaftaran"
                className="mt-2 rounded-lg bg-white px-4 py-3 text-center text-sm font-medium text-[#1E3A8A] transition hover:bg-blue-100"
              >
                Pendaftaran
              </a>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}