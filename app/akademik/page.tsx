import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { db } from "@/prisma/db";

export default async function AkademikPage() {
  const kurikulum = await db.orm.public.Kurikulum.all();
  const kalenderAkademik = await db.orm.public.KalenderAkademik.all();
  const informasiAkademik = await db.orm.public.InformasiAkademik.all();

  return (
    <main>
      <Navbar />

      {/* Page Header */}
      <section className="border-b border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Akademik
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
            Informasi akademik Program Studi Magister Manajemen
            Institut Teknologi dan Bisnis Haji Agus Salim.
          </p>
        </div>
      </section>

      {/* Program Studi */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-2xl font-bold text-slate-900">
            Program Studi
          </h2>

          <p className="mt-4 max-w-3xl leading-relaxed text-slate-600">
            Informasi mengenai Program Studi Magister Manajemen,
            termasuk profil dan penyelenggaraan pendidikan.
          </p>
        </div>
      </section>

      {/* Kurikulum */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-2xl font-bold text-slate-900">
            Kurikulum
          </h2>

          <p className="mt-4 max-w-3xl leading-relaxed text-slate-600">
            Informasi mengenai kurikulum dan mata kuliah yang
            tersedia pada Program Studi Magister Manajemen.
          </p>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {kurikulum.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-slate-200 bg-white p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-semibold text-[#1E3A8A]">
                    {item.kode}
                  </p>

                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-[#1E3A8A]">
                    {item.sks} SKS
                  </span>
                </div>

                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                  {item.nama}
                </h3>

                <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-500">
                  <span>Semester {item.semester}</span>
                  <span>•</span>
                  <span>{item.jenis}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Kalender Akademik */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-2xl font-bold text-slate-900">
            Kalender Akademik
          </h2>

          <p className="mt-4 max-w-3xl leading-relaxed text-slate-600">
            Informasi jadwal dan kalender kegiatan akademik.
          </p>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {kalenderAkademik.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-slate-200 bg-white p-6"
              >
                <h3 className="text-lg font-semibold text-slate-900">
                  {item.kegiatan}
                </h3>

                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {item.tanggalMulai} - {item.tanggalSelesai}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Informasi Akademik */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-2xl font-bold text-slate-900">
            Informasi Akademik
          </h2>

          <p className="mt-4 max-w-3xl leading-relaxed text-slate-600">
            Informasi terkait kegiatan dan ketentuan akademik
            Program Studi Magister Manajemen.
          </p>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {informasiAkademik.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-slate-200 bg-white p-6"
              >
                <h3 className="text-lg font-semibold text-slate-900">
                  {item.judul}
                </h3>

                <p className="mt-3 leading-relaxed text-slate-600">
                  {item.deskripsi}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}