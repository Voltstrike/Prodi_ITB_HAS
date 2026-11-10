import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";
import BeritaForm from "../components/BeritaForm";

export const dynamic = "force-dynamic";

export default async function TambahBeritaPage() {
    await requireAdmin();

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <Link href="/admin/berita" className="text-sm font-medium text-blue-700 hover:underline">
                ← Kembali ke Berita
            </Link>
            <header>
                <h1 className="text-2xl font-bold text-slate-900">Tambah Berita</h1>
                <p className="mt-2 text-sm text-slate-600">
                    Simpan tulisan sebagai draft atau terbitkan setelah lengkap.
                </p>
            </header>
            <BeritaForm />
        </div>
    );
}
