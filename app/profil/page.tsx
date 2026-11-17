import OrganizationChart from "@/components/OrganizationChart";
import ProfileOverview from "@/components/profil/ProfileOverview";
import ProfileAccreditation from "@/components/profil/ProfileAccreditation";
import { validateOrganizationStructure } from "@/lib/organization/structure";
import { getOrganizationPeople } from "@/lib/organization/people";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ImageWithFallback from "@/components/ImageWithFallback";
import { db } from "@/prisma/db";

export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  const profil = await db.orm.public.Profil
    .where({ singletonKey: 1 })
    .first();
  const parsed = validateOrganizationStructure(profil?.strukturOrganisasi);
  const organization = parsed.ok ? parsed.value : null;
  const organizationPeople = organization ? await getOrganizationPeople(organization) : [];

  return (
    <main>
      <Navbar />

      {/* Page Header */}
      <section className="border-b border-slate-100 bg-slate-50">
        <div
          className={`mx-auto max-w-6xl px-6 py-12 sm:py-16 ${
            profil?.fotoProdi
              ? "grid items-center gap-10 md:grid-cols-2"
              : ""
          }`}
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              Profil Program Studi
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
              Mengenal lebih dekat Program Studi Magister Manajemen
              Institut Teknologi dan Bisnis Haji Agus Salim.
            </p>
          </div>

          {profil?.fotoProdi && (
            <div className="relative aspect-4/3 overflow-hidden rounded-2xl bg-slate-200">
              <ImageWithFallback
                src={profil.fotoProdi}
                alt="Program Studi Magister Manajemen ITB Haji Agus Salim"
                fill
                sizes="(max-width: 767px) 100vw, 50vw"
                className="object-cover"
                fallback={
                  <div className="flex h-full items-center justify-center p-6 text-center text-sm text-slate-600">
                    Foto program studi tidak dapat ditampilkan.
                  </div>
                }
              />
            </div>
          )}
        </div>
      </section>

      <nav aria-label="Bagian profil" className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-x-6 gap-y-1 px-6">
          {[
            ["#sejarah", "Sejarah"], ["#visi-misi", "Visi & Misi"],
            ["#struktur-organisasi", "Struktur"], ["#akreditasi", "Akreditasi"],
          ].map(([href, label]) => (
            <a key={href} href={href} className="inline-flex min-h-11 items-center border-b-2 border-transparent py-3 text-sm font-medium text-slate-600 hover:border-blue-600 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">{label}</a>
          ))}
        </div>
      </nav>

      <ProfileOverview sejarah={profil?.sejarah} visi={profil?.visi} misi={profil?.misi} />

      {/* Struktur Organisasi */}
      <section id="struktur-organisasi" aria-labelledby="profil-struktur-heading" className="scroll-mt-24 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-blue-700">Pengelola program studi</p>
          <h2 id="profil-struktur-heading" className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Struktur Organisasi
          </h2>

          {organization ? (
            <div className="mt-8 min-w-0">
              <OrganizationChart structure={organization} people={organizationPeople} />
            </div>
          ) : profil?.struktur?.trim() ? (
            <p className="mt-4 whitespace-pre-line leading-relaxed text-slate-600">
              {profil.struktur.trim()}
            </p>
          ) : (
            <p className="mt-4 leading-relaxed text-slate-600">
              Struktur organisasi Program Studi Magister Manajemen belum
              tersedia.
            </p>
          )}
        </div>
      </section>

      <ProfileAccreditation akreditasi={profil?.akreditasi} dokumen={profil?.dokumenAkreditasi} />

      <Footer />
    </main>
  );
}
