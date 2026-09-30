import Link from "next/link";
import HapusInformasiButton from "./components/HapusInformasiButton";
import { db } from "@/prisma/db";

export default async function InformasiAkademikPage() {
    const informasi = await db.orm.public.InformasiAkademik.all();

    return (
        <main>
            <h1>Informasi Akademik</h1>

            <Link href="/admin/akademik/informasi/tambah">
                Tambah Informasi
            </Link>

            <hr />

            {informasi.length === 0 ? (
                <p>Belum ada informasi akademik.</p>
            ) : (
                <div>
                    {informasi.map((item) => (
                        <article key={item.id}>
                            <h2>{item.judul}</h2>
                            <p>{item.deskripsi}</p>

                            <Link
                                href={`/admin/akademik/informasi/${item.id}`}
                            >
                                Edit
                            </Link>

                            <HapusInformasiButton id={item.id} />
                        </article>
                    ))}
                </div>
            )}
        </main>
    );
}
