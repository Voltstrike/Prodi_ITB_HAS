import { db } from "@/prisma/db";
import Link from "next/link";
import HapusKalenderButton from "./components/HapusKalenderButton";

export default async function AdminKalenderPage() {
    const kalenderAkademik =
        await db.orm.public.KalenderAkademik.all();

    return (
        <main>
            <h1>Kalender Akademik</h1>

            <p>
                Kelola kalender kegiatan akademik
                Program Studi Magister Manajemen
            </p>

            <div>
                <Link href="/admin/akademik/kalender/tambah">
                    Tambah Kegiatan
                </Link>
            </div>

            <div>
                {kalenderAkademik.map((item) => (
                    <article key={item.id}>
                        <h2>{item.kegiatan}</h2>

                        <p>
                            Mulai: {item.tanggalMulai}
                        </p>

                        <p>
                            Selesai: {item.tanggalSelesai}
                        </p>

                        <Link
                            href={`/admin/akademik/kalender/${item.id}`}
                        >
                            Edit
                        </Link>

                        <HapusKalenderButton id={item.id} />
                    </article>
                ))}
            </div>
        </main>
    );
}
