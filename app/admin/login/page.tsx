"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    const form = new FormData(event.currentTarget);
    const email = form.get("email")?.toString().trim() ?? "";
    const password = form.get("password")?.toString() ?? "";

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(
          typeof data?.message === "string"
            ? data.message
            : "Login gagal. Silakan coba lagi.",
        );
        setLoading(false);
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Tidak dapat terhubung ke server. Periksa koneksi dan coba lagi.");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#1E3A8A] text-sm font-bold text-white">
            MM
          </span>
          <span>
            <span className="block text-base font-bold text-slate-900">
              Magister Manajemen
            </span>
            <span className="block text-sm text-slate-500">
              ITB Haji Agus Salim
            </span>
          </span>
        </Link>

        <section
          aria-labelledby="login-title"
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <p className="text-xs font-semibold tracking-wide text-blue-600">
            PORTAL ADMINISTRASI
          </p>
          <h1
            id="login-title"
            className="mt-2 text-2xl font-bold text-slate-900"
          >
            Login Admin
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Masuk untuk mengelola informasi dan konten program studi.
          </p>

          <form
            onSubmit={handleSubmit}
            aria-busy={loading}
            className="mt-7 space-y-5"
          >
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={254}
                required
                disabled={loading}
                placeholder="Masukkan email admin"
                className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <div className="relative mt-2">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  maxLength={128}
                  required
                  disabled={loading}
                  placeholder="Masukkan password"
                  className="block w-full rounded-lg border border-slate-300 bg-white py-3 pl-3 pr-28 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label="Tampilkan password"
                  aria-pressed={showPassword}
                  aria-controls="password"
                  disabled={loading}
                  className="absolute inset-y-0 right-1 my-1 rounded-md px-3 text-xs font-semibold text-blue-700 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-50"
                >
                  {showPassword ? "Sembunyikan" : "Lihat"}
                </button>
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-700"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#1E3A8A] px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-wait disabled:opacity-60"
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>
            <span role="status" className="sr-only">
              {loading ? "Sedang memproses login." : ""}
            </span>
          </form>
        </section>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="rounded text-sm font-medium text-slate-600 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
          >
            <span aria-hidden="true">← </span>
            Kembali ke website
          </Link>
          <p className="mt-4 text-xs text-slate-500">
            Akses khusus pengelola Program Studi Magister Manajemen.
          </p>
        </div>
      </div>
    </main>
  );
}
