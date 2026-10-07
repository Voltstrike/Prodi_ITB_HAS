import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { db } from "@/prisma/db";

interface BeritaDetailPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export default async function BeritaDetailPage({
  params,
}: BeritaDetailPageProps) {
  const { slug } = await params;
  const item = await db.orm.public.Berita
    .where({ slug })
    .first();

  if (!item) {
    notFound();
  }

  return (
    <>
      <Navbar />

      <main className="flex-1 bg-slate-50 px-6 py-10 md:py-16">
        <div className="mx-auto max-w-4xl">
          <nav
            aria-label="Breadcrumb"
            className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500"
          >
            <Link href="/" className="hover:text-blue-700">
              Beranda
            </Link>
            <span aria-hidden="true">/</span>
            <Link href="/berita" className="hover:text-blue-700">
              Berita
            </Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page" className="text-slate-900">
              Detail Berita
            </span>
          </nav>

          <article className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <header className="px-6 py-8 md:px-10 md:py-10">
              <p className="text-sm font-semibold text-blue-600">
                BERITA &amp; KEGIATAN
              </p>
              <p className="mt-3 text-sm text-slate-500">{item.date}</p>
              <h1 className="mt-3 wrap-break-word text-3xl font-bold leading-tight tracking-tight text-slate-900 md:text-4xl">
                {item.title}
              </h1>
              <p className="mt-5 wrap-break-word text-base leading-relaxed text-slate-600 md:text-lg">
                {item.description}
              </p>
            </header>

            {item.image?.trim() && (
              <div className="bg-slate-100">
                <Image
                  src={item.image}
                  alt={item.title}
                  width={1200}
                  height={750}
                  unoptimized
                  sizes="(max-width: 896px) 100vw, 896px"
                  className="h-auto w-full"
                />
              </div>
            )}

            <div className="px-6 py-8 md:px-10 md:py-10">
              <div className="whitespace-pre-wrap wrap-break-word text-base leading-8 text-slate-700">
                {item.content}
              </div>
            </div>

            <footer className="border-t border-slate-200 px-6 py-6 md:px-10">
              <Link
                href="/berita"
                className="inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-blue-700 hover:text-blue-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
              >
                <span aria-hidden="true">←</span>
                Kembali ke daftar berita
              </Link>
            </footer>
          </article>
        </div>
      </main>

      <Footer />
    </>
  );
}
