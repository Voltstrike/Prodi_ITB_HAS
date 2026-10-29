import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/prisma/db";
import { toKegiatanProdiDto } from "@/lib/http/dto";
import KegiatanProdiForm from "@/components/admin/KegiatanProdiForm";

export const dynamic = "force-dynamic";

type Props = {
    params: Promise<{ slug: string }>;
};

export default async function EditKegiatanProdiPage({
    params,
}: Props) {
    const { slug } = await params;

    const [kegiatan, dosen] = await Promise.all([
        db.orm.public.KegiatanProdi.where({ slug }).first(),
        db.orm.public.Dosen.select("id", "nama").all(),
    ]);

    if (!kegiatan) {
        notFound();
    }

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
                    Edit Kegiatan Prodi
                </h1>
                <p className="mt-2 break-words text-sm text-slate-600">
                    {kegiatan.judul}
                </p>
            </div>

            <KegiatanProdiForm
                key={kegiatan.id}
                dosen={pilihanDosen}
                initialValue={toKegiatanProdiDto(kegiatan)}
            />
        </div>
    );
}
