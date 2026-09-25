import { db } from "@/prisma/db";
import Link from "next/link";
import HapusDosenButton from "./components/HapusDosenButton";

export default async function AdminDosenPage() {
    const dosen = await db.orm.public.Dosen.all();

    return (
        <main>
            <h1>Data Dosen</h1>
            <p>Kelola data dosen Program Studi Magister Manajemen</p>

            <div>
                <Link href="/admin/dosen/tambah">
                    Tambah Dosen
                </Link>
            </div>

            <div>
                {dosen.map((item) => (
                    <article key={item.id}>
                        <h2>{item.nama}</h2>
                        <p>NIDN: {item.nidn}</p>
                        <p>Pendidikan: {item.pendidikan}</p>
                        <Link href={`/admin/dosen/${item.id}`}>
                            Edit
                        </Link>
                        
                        <HapusDosenButton slug={item.slug} />
                    </article>
                ))}
            </div>
        </main>
    );
}