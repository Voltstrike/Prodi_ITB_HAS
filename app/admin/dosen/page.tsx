import { db } from "@/prisma/db";

export default async function AdminDosenPage() {
    const dosen = await db.orm.public.Dosen.all();

    return(
        <main>
            <h1>Data Dosen</h1>
            <p>Kelola data dosen Program Studi Magister Manajemen</p>

            <div>
                {dosen.map((item) => (
                    <article key={item.id}>
                        <h2>{item.nama}</h2>
                        <p>NIDN: {item.nidn}</p>
                        <p>Jabatan: {item.jabatan}</p>
                        <p>Bidang Keahlian: {item.bidangKeahlian}</p>
                        <p>Email: {item.email}</p>
                    </article>
                ))}
            </div>
        </main>
    );
    
}