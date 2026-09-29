import { db } from "@/prisma/db";
import Link from "next/link";
import HpausKurikulumButton from "./components/HapusKurikulumButton"
import HapusKurikulumButton from "./components/HapusKurikulumButton";

export default async function AdminKurikulumPage() {
    const kurikulum = await db.orm.public.Kurikulum.all();

    return (
        <main>
            <h1>Kurikulum</h1>
            <p>Kelola data kurikulum Program Studi Magister Manajemen</p>

            <div>
                <Link href="/admin/akademik/kurikulum/tambah">
                    Tambah Mata Kuliah
                </Link>
            </div>

            <div>
                {kurikulum.map((item) => (
                    <article key={item.id}>
                        <h2>
                            {item.kode} - {item.nama}
                        </h2>

                        <p>SKS: {item.sks}</p>
                        <p>Semester: {item.semester}</p>
                        <p>Jenis: {item.jenis}</p>

                        <Link
                            href={`/admin/akademik/kurikulum/${item.id}`}
                        >
                            Edit
                        </Link>

                        <HapusKurikulumButton id={item.id}/>
                    </article>
                ))}
            </div>
        </main>
    );
}
