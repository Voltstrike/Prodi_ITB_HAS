import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { db } from "@/prisma/db";
import KurikulumSection from "@/components/akademik/KurikulumSection";
import { KATEGORI_DOKUMEN } from "@/lib/dokumen/constants";
import { toDokumenKurikulumDto } from "@/lib/http/dto";

export const dynamic = "force-dynamic";

export default async function AkademikPage({
  searchParams,
}: {
  searchParams: Promise<{
    semester?: string | string[];
    konsentrasi?: string | string[];
  }>;
}) {
  const [
    params,
    kurikulum,
    kalenderAkademik,
    informasiAkademik,
    dokumen,
  ] = await Promise.all([
    searchParams,
    db.orm.public.Kurikulum.all(),
    db.orm.public.KalenderAkademik.all(),
    db.orm.public.InformasiAkademik.all(),
    db.orm.public.DokumenKurikulum
      .where({ kategori: "KURIKULUM" })
      .orderBy([
        (item) => item.createdAt.desc(),
        (item) => item.id.desc(),
      ])
      .all(),
  ]);

  const daftarDokumen = dokumen.map(toDokumenKurikulumDto);

  const kelompokDokumen = KATEGORI_DOKUMEN.map((kategori) => ({
    ...kategori,
    anchor: `dokumen-${kategori.value.toLowerCase().replaceAll("_", "-")}`,
    dokumen: daftarDokumen.filter(
      (item) => item.kategori === kategori.value,
    ),
  }));

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
      <KurikulumSection
        items={kurikulum}
        semester={params.semester}
        konsentrasi={params.konsentrasi}
      />

            {/* Dokumen Akademik */}
      <section
        id="dokumen-akademik"
        aria-labelledby="judul-dokumen-akademik"
        className="scroll-mt-24 border-t border-slate-200 bg-slate-50"
      >
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2
            id="judul-dokumen-akademik"
            className="text-2xl font-bold text-slate-900"
          >
            Dokumen Akademik
          </h2>

          <p className="mt-4 max-w-3xl leading-relaxed text-slate-600">
            Baca atau unduh dokumen kurikulum Program Studi
            Magister Manajemen.
          </p>

          <div className="mt-8 space-y-8">
            {kelompokDokumen.map((kelompok) => (
              <section
                key={kelompok.value}
                id={kelompok.anchor}
                aria-labelledby={`judul-${kelompok.anchor}`}
                className="scroll-mt-24 rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3
                    id={`judul-${kelompok.anchor}`}
                    className="text-lg font-semibold text-slate-900"
                  >
                    {kelompok.label}
                  </h3>

                  <p className="text-sm text-slate-500">
                    {kelompok.dokumen.length} dokumen
                  </p>
                </div>

                {kelompok.dokumen.length === 0 ? (
                  <p className="mt-4 text-sm text-slate-500">
                    Dokumen pada kategori ini belum tersedia.
                  </p>
                ) : (
                  <ul className="mt-5 space-y-5">
                    {kelompok.dokumen.map((item) => (
                      <li
                        key={item.id}
                        className="rounded-lg border border-slate-200 p-4 sm:p-5"
                      >
                        <h4 className="break-words font-semibold text-slate-900">
                          {item.judul}
                        </h4>

                        <p className="mt-2 break-all text-sm text-slate-600">
                          {item.namaAsli}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          PDF · {Math.ceil(item.ukuran / 1024)} KB
                        </p>

                        <div className="mt-4 flex flex-wrap gap-3">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg border border-blue-200 px-4 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-50"
                          >
                            Buka PDF (tab baru)
                          </a>

                          <a
                            href={`${item.url}?download=1`}
                            className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-800"
                          >
                            Download PDF
                          </a>
                        </div>

                        <details className="mt-5">
                          <summary className="cursor-pointer text-sm font-semibold text-blue-700">
                            Lihat Preview PDF
                          </summary>

                          <iframe
                            src={item.url}
                            title={`Preview ${item.judul}`}
                            loading="lazy"
                            className="mt-4 h-[70vh] min-h-96 w-full rounded-lg border border-slate-200"
                          />

                          <p className="mt-3 text-sm text-slate-500">
                            Jika preview tidak tampil, gunakan tombol
                            Buka PDF atau Download PDF.
                          </p>
                        </details>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </div>
      </section>

      {/* Kalender Akademik */}
      <section id="kalender-akademik" className="scroll-mt-24 bg-white">
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
