import { db } from "@/prisma/db";
import Link from "next/link";

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
                        <p>Jabatan: {item.jabatan}</p>
                        <p>Bidang Keahlian: {item.bidangKeahlian}</p>
                        <p>Email: {item.email}</p>

                        <Link href={`/admin/dosen/${item.id}`}>
                            Edit
                        </Link>
                    </article>
                ))}
            </div>
        </main>
    );
}