const academicLinks = [
  {
    title: "Portal Mahasiswa",
    description:
      "Pengisian KRS, pengecekan tagihan, dan layanan akademik mahasiswa.",
    href: "https://simpt.itbhas.ac.id/",
  },
  {
    title: "E-Learning",
    description:
      "Akses materi, tugas, dan kegiatan pembelajaran daring.",
    href: "https://elearning.itbhas.ac.id/",
  },
  {
    title: "Perpustakaan",
    description:
      "Pencarian koleksi dan akses layanan perpustakaan kampus.",
    href: "https://perpus.itbhas.ac.id/",
  },
];

export default function Documents() {
  return (
    <section aria-labelledby="layanan-akademik" className="px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <p className="mb-2 text-sm font-semibold text-blue-600">
          TAUTAN
        </p>

        <h2
          id="layanan-akademik"
          className="text-3xl font-bold text-slate-900"
        >
          Layanan Akademik
        </h2>

        <p className="mt-3 max-w-2xl text-slate-600">
          Akses portal mahasiswa, platform pembelajaran, dan layanan
          perpustakaan kampus.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {academicLinks.map((item) => (
            <a
              key={item.title}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
            >
              <h3 className="font-semibold text-slate-900 transition group-hover:text-blue-700">
                {item.title}
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                {item.description}
              </p>

              <span className="mt-auto block pt-4 text-sm font-medium text-blue-600">
                Buka Layanan <span aria-hidden="true">↗</span>
              </span>
              <span className="sr-only"> (terbuka di tab baru)</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
