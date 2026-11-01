import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { db } from "@/prisma/db";
import Link from "next/link";
import { KONSENTRASI_KURIKULUM } from "@/lib/kurikulum/constants";
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
      .orderBy([
        (item) => item.createdAt.desc(),
        (item) => item.id.desc(),
      ])
      .all(),
  ]);

  const daftarDokumen = dokumen.map(toDokumenKurikulumDto);

  const pilihanSemester = [
    ...new Set(kurikulum.map((item) => item.semester)),
  ].sort((a, b) => a - b);

  const semester = pilihanSemester.find(
    (nilai) => String(nilai) === params.semester,
  );

  const konsentrasi = KONSENTRASI_KURIKULUM.find(
    (pilihan) => pilihan === params.konsentrasi,
  ) ?? "";

  const daftarKurikulum = kurikulum
    .filter(
      (item) =>
        (semester === undefined || item.semester === semester) &&
        (konsentrasi === "" || item.konsentrasi === konsentrasi),
    )
    .sort(
      (a, b) =>
        a.semester - b.semester ||
        a.kode.localeCompare(b.kode, "id"),
    );

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
      <section id="kurikulum" className="scroll-mt-24 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-2xl font-bold text-slate-900">
            Kurikulum
          </h2>

          <p className="mt-4 max-w-3xl leading-relaxed text-slate-600">
            Informasi mengenai kurikulum dan mata kuliah yang
            tersedia pada Program Studi Magister Manajemen.
          </p>

          <section
            aria-labelledby="judul-dokumen-kurikulum"
            className="mt-8 rounded-xl border border-slate-200 bg-white p-5"
          >
            <h3
              id="judul-dokumen-kurikulum"
              className="text-lg font-semibold text-slate-900"
            >
              Dokumen Kurikulum
            </h3>

            {daftarDokumen.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">
                Dokumen kurikulum belum tersedia.
              </p>
            ) : (
              <ul className="mt-5 space-y-5">
                {daftarDokumen.map((item) => (
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

          <form
            key={`${semester ?? ""}:${konsentrasi}`}
            action="/akademik#kurikulum"
            method="get"
            className="mt-8 flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-5"
          >
            <label className="min-w-40 flex-1 text-sm font-medium text-slate-700">
              Semester
              <select
                name="semester"
                defaultValue={semester ?? ""}
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500"
              >
                <option value="">Semua Semester</option>

                {pilihanSemester.map((nilai) => (
                  <option key={nilai} value={nilai}>
                    Semester {nilai}
                  </option>
                ))}
              </select>
            </label>

            <label className="min-w-40 flex-1 text-sm font-medium text-slate-700">
              Kelompok / Konsentrasi
              <select
                name="konsentrasi"
                defaultValue={konsentrasi}
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500"
              >
                <option value="">Semua Kelompok / Konsentrasi</option>

                {KONSENTRASI_KURIKULUM.map((pilihan) => (
                  <option key={pilihan} value={pilihan}>
                    {pilihan}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800"
            >
              Terapkan
            </button>

            <Link
              href="/akademik#kurikulum"
              className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Reset
            </Link>
          </form>

          <p role="status" className="mt-5 text-sm text-slate-500">
            Menampilkan {daftarKurikulum.length} mata kuliah
          </p>

          {daftarKurikulum.length === 0 && (
            <div className="mt-5 rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
              Belum ada mata kuliah yang sesuai dengan pilihan filter.
            </div>
          )}

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {daftarKurikulum.map((item) => (
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
                  <span aria-hidden="true">•</span>
                  <span>{item.jenis}</span>

                  {item.konsentrasi && (
                    <>
                      <span aria-hidden="true">•</span>
                      <span>{item.konsentrasi}</span>
                    </>
                  )}
                </div>
              </article>
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
