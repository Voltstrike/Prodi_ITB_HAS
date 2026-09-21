const academicInfo = [
  {
    title: "Kurikulum",
    description:
      "Informasi mengenai struktur kurikulum dan mata kuliah Program Studi Magister Manajemen.",
    image: "/academic-kurikulum.jpg",
    href: "/akademik/kurikulum",
  },
  {
    title: "Kalender Akademik",
    description:
      "Jadwal dan informasi penting kegiatan akademik selama tahun perkuliahan.",
    image: "/academic-kalender.jpg",
    href: "/akademik/kalender",
  },
  {
    title: "Pendaftaran",
    description:
      "Informasi persyaratan dan proses pendaftaran mahasiswa baru.",
    image: "/academic-pendaftaran.jpg",
    href: "/pendaftaran",
  },
];

export default function AcademicInfo() {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-6xl">
        
        {/* Heading */}
        <div className="flex items-end justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold text-blue-600">
              AKADEMIK
            </p>

            <h2 className="text-3xl font-bold text-slate-900">
              Info Akademik
            </h2>

            <p className="mt-3 max-w-2xl text-slate-600">
              Informasi akademik terbaru untuk mahasiswa dan calon
              mahasiswa Magister Manajemen.
            </p>
          </div>

          <a
            href="/akademik"
            className="hidden text-sm font-medium text-blue-600 hover:underline md:block"
          >
            Lihat Semua →
          </a>
        </div>

        {/* Cards */}
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {academicInfo.map((item) => (
            <article
              key={item.title}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white"
            >
              <img
                src={item.image}
                alt={item.title}
                className="aspect-16/10 w-full object-cover"
              />

              <div className="p-5">
                <h3 className="text-lg font-semibold text-slate-900">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {item.description}
                </p>

                <a
                  href={item.href}
                  className="mt-4 inline-block text-sm font-medium text-slate-900 hover:underline"
                >
                  Selengkapnya →
                </a>
              </div>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
}