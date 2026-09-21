const documents = [
  {
    title: "SIAKAD",
    description: "Sistem Informasi Akademik",
    href: "#",
  },
  {
    title: "E-Learning",
    description: "Platform pembelajaran",
    href: "#",
  },
  {
    title: "Perpustakaan",
    description: "Akses layanan perpustakaan",
    href: "#",
  },
];

export default function Documents() {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-6xl">
        {/* Heading */}
        <div className="flex items-end justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold text-blue-600">
              TAUTAN
            </p>

            <h2 className="text-3xl font-bold text-slate-900">
              Dokumen & Link
            </h2>

            <p className="mt-3 max-w-2xl text-slate-600">
              Akses cepat ke berbagai sistem dan layanan yang
              berkaitan dengan kegiatan akademik.
            </p>
          </div>

          <a
            href="/dokumen"
            className="hidden text-sm font-medium text-blue-600 hover:underline md:block"
          >
            Lihat Semua →
          </a>
        </div>

        {/* Links */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {documents.map((item) => (
            <a
              key={item.title}
              href={item.href}
              className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-md"
            >
              <h3 className="font-semibold text-slate-900">
                {item.title}
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                {item.description}
              </p>

              <span className="mt-4 inline-block text-sm font-medium text-blue-600">
                Buka →
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}