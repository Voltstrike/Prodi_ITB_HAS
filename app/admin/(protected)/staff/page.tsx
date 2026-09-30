import { db } from "@/prisma/db";
import Link from "next/link";
import HapusStaffButton from "./components/HapusStaffButton";

export default async function AdminStaffPage() {
    const staff = await db.orm.public.Staff.all();

    return (
        <main>
            <h1>Data Staff</h1>
            <p>Kelola data staff Program Studi Magister Manajemen</p>

            <div>
                <Link href="/admin/staff/tambah">
                    Tambah Staff
                </Link>
            </div>

            <div>
                {staff.map((item) => (
                    <article key={item.id}>
                        <h2>{item.nama}</h2>
                        <p>
                            Pendidikan: {item.pendidikan ?? "-"}
                        </p>
                        <p>Jabatan: {item.jabatan}</p>
                        <p>
                            Lingkup Kerja:{" "}
                            {item.lingkupKerja ?? "-"}
                        </p>

                        <Link href={`/admin/staff/${item.id}`}>
                            Edit
                        </Link>

                        <HapusStaffButton id={item.id} />
                    </article>
                ))}
            </div>
        </main>
    );
}
