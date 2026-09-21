export default function Navbar() {
  return (
    <header className="border-b border-slate-100 bg-[#1E3A8A]">
      <nav className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">

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

        {/* Navigation */}
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

        {/* CTA */}
        <a
          href="/pendaftaran"
          className="hidden rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-[#1E3A8A] transition hover:bg-blue-100 md:block"
        >
          Pendaftaran
        </a>

      </nav>
    </header>
  );
}