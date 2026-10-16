import { WHATSAPP_URL } from "@/lib/contact";
import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Pendaftaran | Magister Manajemen ITB HAS",
  description:
    "Informasi pendaftaran Program Studi Magister Manajemen ITB Haji Agus Salim dan akses ke portal PMB kampus.",
};

const PMB_URL = "https://itbhas.pmbonline.siakad.tech/";


const langkah = [
  {
    judul: "Buka portal PMB kampus",
    deskripsi:
      "Gunakan tombol Buka Portal PMB untuk menuju layanan penerimaan mahasiswa baru kampus.",
  },
  {
    judul: "Periksa program dan ketentuan",
    deskripsi:
      "Pastikan program dan jalur pendaftaran sesuai dengan Magister Manajemen. Periksa jadwal dan persyaratan yang dicantumkan.",
  },
  {
    judul: "Ikuti petunjuk pendaftaran",
    deskripsi:
      "Lanjutkan pengisian formulir dan tahapan pendaftaran sesuai petunjuk pada portal PMB kampus.",
  },
];

export default function PendaftaranPage() {
  return (
    <>
      <Navbar />

      <main className="flex-1 bg-slate-50">
        <section className="border-b border-slate-200 bg-white px-6 py-12 md:py-16">
          <div className="mx-auto max-w-6xl">
            <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-500">
              <Link href="/" className="transition hover:text-blue-700">
                Beranda
              </Link>
              <span aria-hidden="true" className="mx-3">/</span>
              <span aria-current="page" className="text-slate-900">
                Pendaftaran
              </span>
            </nav>

            <p className="mb-2 text-sm font-semibold text-blue-600">
              MAHASISWA BARU
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              Pendaftaran Magister Manajemen
            </h1>
            <p className="mt-4 max-w-2xl leading-relaxed text-slate-600">
              Pendaftaran mahasiswa baru Program Studi Magister Manajemen
              Institut Teknologi dan Bisnis Haji Agus Salim dilakukan melalui
              portal PMB kampus.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={PMB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
              >
                Buka Portal PMB
                <span aria-hidden="true">↗</span>
                <span className="sr-only">(terbuka di tab baru)</span>
              </a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-lg border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
              >
                WhatsApp Admin
                <span className="sr-only"> (terbuka di tab baru)</span>
              </a>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Portal PMB akan terbuka di tab baru.
            </p>
          </div>
        </section>

        <section aria-labelledby="panduan-pendaftaran" className="px-6 py-12 md:py-16">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h2 id="panduan-pendaftaran" className="text-2xl font-bold text-slate-900">
                Panduan Pendaftaran
              </h2>
              <p className="mt-3 leading-relaxed text-slate-600">
                Gunakan portal PMB kampus sebagai rujukan informasi dan proses
                pendaftaran mahasiswa baru.
              </p>

              <ol className="mt-8 space-y-4">
                {langkah.map((item, index) => (
                  <li key={item.judul} className="flex gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
                    <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-900">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900">
                        {item.judul}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">
                        {item.deskripsi}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <aside aria-labelledby="informasi-pendaftaran" className="self-start rounded-xl border border-blue-100 bg-blue-50 p-6">
              <h2 id="informasi-pendaftaran" className="text-lg font-semibold text-blue-950">
                Jadwal dan Persyaratan
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-blue-900">
                Lihat pengumuman dan petunjuk PMB kampus untuk mengetahui periode
                penerimaan, dokumen yang diperlukan, serta ketentuan seleksi.
              </p>
              <div className="mt-6 border-t border-blue-200 pt-5">
                <h3 className="font-semibold text-blue-950">Butuh bantuan?</h3>
                <p className="mt-2 text-sm leading-relaxed text-blue-900">
                  Hubungi kampus jika membutuhkan penjelasan mengenai
                  pendaftaran Program Studi Magister Manajemen.
                </p>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block text-sm font-semibold text-blue-900 underline underline-offset-4 hover:text-blue-700"
                >
                  Hubungi Admin via WhatsApp →
                  <span className="sr-only"> (terbuka di tab baru)</span>
                </a>
              </div>
            </aside>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
