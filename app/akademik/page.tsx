import { db } from "@/prisma/db";
import { informasiAkademik } from "@/data/informasiAkademik";

export default async function AkademikPage() {
  const kurikulum = await db.orm.public.Kurikulum.all();
  const kalenderAkademik = await db.orm.public.KalenderAkademik.all();

  return (
    <main>
      {/* Page Header */}
      <section>
        <h1>Akademik</h1>
        <p>
          Informasi akademik Program Studi Magister Manajemen
          Institut Teknologi dan Bisnis Haji Agus Salim.
        </p>
      </section>

      {/* Program Studi */}
      <section>
        <h2>Program Studi</h2>
        <p>
          Informasi mengenai Program Studi Magister Manajemen,
          termasuk profil dan penyelenggaraan pendidikan.
        </p>
      </section>

      {/* Kurikulum */}
      <section>
        <h2>Kurikulum</h2>
        <p>
          Informasi mengenai kurikulum dan mata kuliah yang
          tersedia pada Program Studi Magister Manajemen.
        </p>

        <div>
          {kurikulum.map((item) => (
            <article key={item.id}>
              <p>{item.kode}</p>
              <h3>{item.nama}</h3>
              <p>{item.sks} SKS</p>
              <p>Semester {item.semester}</p>
              <p>{item.jenis}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Kalender Akademik */}
      <section>
        <h2>Kalender Akademik</h2>
        <p>Informasi jadwal dan kalender kegiatan akademik.</p>

        <div>
          {kalenderAkademik.map((item) => (
            <article key={item.id}>
              <h3>{item.kegiatan}</h3>
              <p>
                {item.tanggalMulai} - {item.tanggalSelesai}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Informasi Akademik */}
      <section>
        <h2>Informasi Akademik</h2>
        <p>
          Informasi terkait kegiatan dan ketentuan akademik
          Program Studi Magister Manajemen.
        </p>

        <div>
          {informasiAkademik.map((item) => (
            <article key={item.id}>
              <h3>{item.judul}</h3>
              <p>{item.deskripsi}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}