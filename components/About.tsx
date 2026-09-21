export default function About() {
  return (
    <section className="bg-slate-50 px-6 py-16">
      <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
        
        {/* Image */}
        <div className="overflow-hidden rounded-2xl">
          <img
            src="/about.jpg"
            alt="Kegiatan Program Studi Magister Manajemen"
            className="aspect-4/3 h-full w-full object-cover"
          />
        </div>

        {/* Content */}
        <div>
          <p className="mb-3 text-sm font-semibold text-blue-600">
            TENTANG PROGRAM STUDI
          </p>

          <h2 className="text-3xl font-bold leading-tight text-slate-900">
            Program Studi Magister Manajemen
          </h2>

          <p className="mt-5 leading-relaxed text-slate-600">
            Program Studi Magister Manajemen ITB Haji Agus Salim
            merupakan program pendidikan pascasarjana yang dirancang
            untuk mengembangkan kemampuan manajerial, kepemimpinan,
            dan pengambilan keputusan strategis.
          </p>

          <a
            href="/profil"
            className="mt-6 inline-block rounded-md bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Selengkapnya
          </a>
        </div>

      </div>
    </section>
  );
}