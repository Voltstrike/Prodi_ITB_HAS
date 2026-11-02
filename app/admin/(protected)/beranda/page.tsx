import BerandaForm from "@/components/admin/BerandaForm";
import { toBerandaDto } from "@/lib/http/dto";
import { db } from "@/prisma/db";

export const dynamic = "force-dynamic";

export default async function AdminBerandaPage() {
    const beranda = await db.orm.public.Beranda
        .where({ singletonKey: 1 })
        .first();

    return (
        <div className="mx-auto max-w-6xl space-y-8">
            <section>
                <h1 className="text-2xl font-bold text-slate-900">
                    Foto Beranda
                </h1>

                <p className="mt-2 text-sm text-slate-600">
                    Kelola foto kegiatan kampus dan gambar kartu
                    Info Akademik pada halaman beranda.
                </p>

                <p className="mt-2 text-sm text-slate-500">
                    Foto program studi dikelola melalui menu Profil.
                    Foto pada kartu berita dikelola melalui menu Berita.
                </p>
            </section>

            <BerandaForm initialValues={toBerandaDto(beranda)} />
        </div>
    );
}
