import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ImageWithFallback from "@/components/ImageWithFallback";
import { db } from "@/prisma/db";

export const metadata: Metadata = {
  title: "Profil Dosen | Magister Manajemen ITB HAS",
  description:
    "Profil dan riwayat pendidikan dosen Program Studi Magister Manajemen ITB Haji Agus Salim.",
};

export const dynamic = "force-dynamic";

interface DosenDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function DosenDetailPage({
  params,
}: DosenDetailPageProps) {
  const { slug } = await params;
  const item = await db.orm.public.Dosen
    .where({ slug })
    .first();

  if (!item) {
    notFound();
  }

  const pendidikan = [
    { jenjang: "S1", keterangan: item.pendidikanS1 },
    { jenjang: "S2", keterangan: item.pendidikanS2 },
    { jenjang: "S3", keterangan: item.pendidikanS3 },
  ];

  return (
    <>
      <Navbar />

      <main className="flex-1 bg-slate-50">
        <section className="border-b border-slate-200 bg-white px-6 py-12 md:py-16">
          <div className="mx-auto max-w-6xl">
            <nav
              aria-label="Breadcrumb"
              className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-500"
            >
              <Link href="/" className="transition hover:text-blue-700">
                Beranda
              </Link>
              <span aria-hidden="true">/</span>
              <Link href="/dosen" className="transition hover:text-blue-700">
                Dosen &amp; Staff
              </Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page" className="break-words text-slate-900">
                {item.nama}
              </span>
            </nav>

            <p className="mb-2 text-sm font-semibold text-blue-600">
              DOSEN
            </p>
            <h1 className="break-words text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              {item.nama}
            </h1>
            <p className="mt-4 max-w-2xl leading-relaxed text-slate-600">
              Program Studi Magister Manajemen Institut Teknologi dan Bisnis
              Haji Agus Salim.
            </p>
          </div>
        </section>

        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 md:py-12 lg:grid-cols-3">
          <aside
            aria-label="Foto dan identitas dosen"
            className="min-w-0 self-start rounded-xl border border-slate-200 bg-white p-6"
          >
            <div className="relative mx-auto aspect-square w-full max-w-72 overflow-hidden rounded-lg bg-slate-100">
              <ImageWithFallback
                src={item.foto}
                fallbackSrc="/dosen/default.jpg"
                alt={item.nama}
                fill
                sizes="288px"
                className="object-cover"
              />
            </div>

            <dl className="mt-6 border-t border-slate-100 pt-5">
              <dt className="text-sm font-medium text-slate-500">NIDN</dt>
              <dd className="mt-1 break-words font-semibold text-slate-900">
                {item.nidn || "-"}
              </dd>
            </dl>
          </aside>

          <div className="min-w-0 space-y-6 lg:col-span-2">
            <section
              aria-labelledby="pendidikan-dosen"
              className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8"
            >
              <h2
                id="pendidikan-dosen"
                className="text-2xl font-bold text-slate-900"
              >
                Riwayat Pendidikan
              </h2>

              <dl className="mt-6 grid gap-4 sm:grid-cols-3">
                {pendidikan.map((entry) => (
                  <div
                    key={entry.jenjang}
                    className="min-w-0 rounded-lg bg-slate-50 p-4"
                  >
                    <dt className="text-sm font-semibold text-blue-700">
                      {entry.jenjang}
                    </dt>
                    <dd className="mt-2 whitespace-pre-line break-words text-sm leading-relaxed text-slate-600">
                      {entry.keterangan?.trim() || "Belum tersedia."}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <section
              aria-labelledby="profil-dosen"
              className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8"
            >
              <h2
                id="profil-dosen"
                className="text-2xl font-bold text-slate-900"
              >
                Profil Dosen
              </h2>
              <p className="mt-4 whitespace-pre-line break-words leading-relaxed text-slate-600">
                {item.profil?.trim() || "Profil dosen belum tersedia."}
              </p>
            </section>

            <Link
              href="/dosen"
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline"
            >
              <span aria-hidden="true">←</span>
              Kembali ke Daftar Dosen
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
