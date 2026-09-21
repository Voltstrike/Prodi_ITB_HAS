import Image from "next/image";
import Link from "next/link";
import { db } from "@/prisma/db";

export default async function DosenPage() {
  const dosen = await db.orm.public.Dosen.all();
  
  return (
    <main>
      {/* Page Header */}
      <section>
        <h1>Dosen & Staff</h1>
        <p>
          Informasi dosen dan tenaga kependidikan Program Studi
          Magister Manajemen Institut Teknologi dan Bisnis Haji Agus Salim.
        </p>
      </section>

      {/* Dosen */}
      <section>
        <h2>Dosen</h2>

        <div>
          {dosen.map((item) => (
            <article key={item.id}>
              <Link href={`/dosen/${item.slug}`}>
                <Image
                  src={item.foto}
                  alt={item.nama}
                  width={200}
                  height={200}
                />

                <h3>{item.nama}</h3>
                <p>NIDN: {item.nidn}</p>
                <p>{item.jabatan}</p>
                <p>{item.bidangKeahlian}</p>

                <p>Lihat Profil →</p>
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* Staff */}
      <section>
        <h2>Staff</h2>
        <div>[Daftar Staff]</div>
      </section>
    </main>
  );
}