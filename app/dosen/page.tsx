import { db } from "@/prisma/db";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DosenCarousel from "./components/DosenCarousel";
import StaffCarousel from "./components/StaffCarousel";

export default async function DosenPage() {
  const dosen = await db.orm.public.Dosen.all();
  const staff = await db.orm.public.Staff.all();
  
  return (
    <main>
      <Navbar />
      {/* Page Header */}
      <section className="border-b border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Dosen & Staff
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
            Informasi dosen dan tenaga kependidikan Program Studi
            Magister Manajemen Institut Teknologi dan Bisnis Haji Agus Salim.
          </p>
        </div>
      </section>

      {/* Dosen */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-2xl font-bold text-slate-900">
            Dosen
          </h2>

          <div className="mt-8">
            <DosenCarousel dosen={dosen} />
          </div>
        </div>
      </section>

      {/* Staff */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-2xl font-bold text-slate-900">
            Staff
          </h2>

          <div className="mt-8">
            <StaffCarousel staff={staff} />
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}