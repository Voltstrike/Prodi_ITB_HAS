import BerandaPhoto from "./BerandaPhoto";

type Props = {
  foto?: string | null;
};

export default function About({ foto }: Props) {
  return (
    <section className="bg-slate-50 px-6 py-16">
      <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
        
        {/* Image */}
        <div className="overflow-hidden rounded-2xl">
          <BerandaPhoto
            src={foto}
            loading="eager"
            alt="Program Studi Magister Manajemen ITB Haji Agus Salim"
            emptyText="Foto program studi belum tersedia"
          />
        </div>

        {/* Content */}
        <div>
          <p className="mb-3 text-sm font-semibold text-blue-600">
            TENTANG PROGRAM STUDI
          </p>

          <h2 className="text-3xl font-bold leading-tight text-slate-900">
            Program Studi Magister Manajemen
          </h2>

          <p className="mt-5 leading-relaxed text-slate-600">
            Program Studi Magister Manajemen ITB Haji Agus Salim
            merupakan program pendidikan pascasarjana yang dirancang
            untuk mengembangkan kemampuan manajerial, kepemimpinan,
            dan pengambilan keputusan strategis.
          </p>

          <a
            href="/profil"
            className="mt-6 inline-block rounded-md bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Selengkapnya
          </a>
        </div>

      </div>
    </section>
  );
}