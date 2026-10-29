import Link from "next/link";
import { db } from "@/prisma/db";
import KegiatanProdiForm from "@/components/admin/KegiatanProdiForm";

export const dynamic = "force-dynamic";

export default async function TambahKegiatanProdiPage() {
    const dosen = await db.orm.public.Dosen
        .select("id", "nama")
        .all();

    const pilihanDosen = [...dosen].sort(
        (a, b) => a.nama.localeCompare(b.nama, "id"),
    );

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <Link
                href="/admin/kegiatan-prodi"
                className="text-sm font-medium text-blue-700 hover:underline"
            >
                ← Kembali ke Kegiatan Prodi
            </Link>

            <div>
                <h1 className="text-2xl font-bold text-slate-900">
                    Tambah Kegiatan Prodi
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                    Tambahkan kegiatan penelitian atau pengabdian masyarakat.
                </p>
            </div>

            <KegiatanProdiForm dosen={pilihanDosen} />
        </div>
    );
}
