export default function Footer() {
  return (
    <footer className="bg-[#1E3A8A] px-6 py-12 text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-4">

        {/* Brand */}
        <div className="md:col-span-2">
          <h2 className="text-lg font-bold text-white">
            Magister Manajemen ITBHAS
          </h2>

          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
            Program Studi Magister Manajemen Institut Teknologi
            dan Bisnis Haji Agus Salim Bukittinggi.
          </p>
        </div>

        {/* Navigation */}
        <div>
          <h3 className="font-semibold text-white">
            Navigasi
          </h3>

          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a href="/" className="hover:text-white">
                Beranda
              </a>
            </li>

            <li>
              <a href="/profil" className="hover:text-white">
                Profil
              </a>
            </li>

            <li>
              <a href="/akademik" className="hover:text-white">
                Akademik
              </a>
            </li>

            <li>
              <a href="/berita" className="hover:text-white">
                Berita
              </a>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="font-semibold text-white">
            Kontak
          </h3>

          <div className="mt-4 space-y-2 text-sm text-slate-400">
            <p>ITB Haji Agus Salim</p>
            <p>Bukittinggi, Sumatera Barat</p>
            <p>Email: info@itbhas.ac.id</p>
          </div>
        </div>

      </div>

      {/* Bottom */}
      <div className="mx-auto mt-10 max-w-6xl border-t border-slate-800 pt-6">
        <p className="text-xs text-slate-500">
          © 2026 Magister Manajemen ITB Haji Agus Salim.
          All rights reserved.
        </p>
      </div>
    </footer>
  );
}