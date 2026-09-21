export default function Hero() {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
        
        {/* Text */}
        <div>
          <p className="mb-3 text-sm font-semibold text-blue-600">
            PROGRAM STUDI
          </p>

          <h1 className="text-4xl font-bold leading-tight text-slate-900">
            Magister Manajemen
          </h1>

          <p className="mt-4 max-w-lg text-base leading-relaxed text-slate-600">
            Program studi Magister Manajemen untuk mengembangkan
            kompetensi manajerial dan kepemimpinan profesional.
          </p>

          <div className="mt-6 flex gap-3">
            <a
              href="/profil"
              className="rounded-md bg-slate-900 px-5 py-3 text-sm font-medium text-white"
            >
              Pelajari Lebih Lanjut
            </a>

            <a
              href="/kontak"
              className="rounded-md border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700"
            >
              Hubungi Kami
            </a>
          </div>
        </div>

        {/* Image */}
        <div>
          <div className="aspect-4/3 overflow-hidden rounded-2xl bg-slate-200">
            <img
              src="/hero.jpg"
              alt="Kegiatan Program Studi Magister Manajemen"
              className="h-full w-full object-cover"
            />
          </div>
        </div>

      </div>
    </section>
  );
}