import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ProfilPage() {
  return (
    <main>
      <Navbar />

      {/* Page Header */}
      <section className="border-b border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Profil Program Studi
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
            Mengenal lebih dekat Program Studi Magister Manajemen
            Institut Teknologi dan Bisnis Haji Agus Salim.
          </p>
        </div>
      </section>

      {/* Sejarah */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-2xl font-bold text-slate-900">
            Sejarah
          </h2>

          <p className="mt-4 max-w-3xl leading-relaxed text-slate-600">
            Informasi mengenai sejarah berdirinya dan perkembangan
            Program Studi Magister Manajemen.
          </p>
        </div>
      </section>

      {/* Visi & Misi */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-2xl font-bold text-slate-900">
            Visi & Misi
          </h2>

          <div className="mt-8 grid gap-8 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-slate-900">
                Visi
              </h3>

              <p className="mt-3 leading-relaxed text-slate-600">
                Visi Program Studi Magister Manajemen.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-slate-900">
                Misi
              </h3>

              <p className="mt-3 leading-relaxed text-slate-600">
                Misi Program Studi Magister Manajemen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Struktur Organisasi */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-2xl font-bold text-slate-900">
            Struktur Organisasi
          </h2>

          <p className="mt-4 leading-relaxed text-slate-600">
            Struktur organisasi Program Studi Magister Manajemen.
          </p>

          <div className="mt-8 flex min-h-64 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
            Struktur Organisasi
          </div>
        </div>
      </section>

      {/* Akreditasi */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-2xl font-bold text-slate-900">
            Akreditasi
          </h2>

          <p className="mt-4 max-w-3xl leading-relaxed text-slate-600">
            Informasi mengenai status dan dokumen akreditasi
            Program Studi Magister Manajemen.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}