import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";
import { publicationMaxYear } from "@/lib/publikasi/validation";
import PublicationForm from "../components/PublicationForm";

export const dynamic = "force-dynamic";

export default async function AddPublicationPage() {
    await requireAdmin();

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <Link
                href="/admin/publikasi"
                className="text-sm font-medium text-blue-700 hover:underline"
            >
                ← Kembali ke Publikasi Ilmiah
            </Link>
            <header>
                <h1 className="text-2xl font-bold text-slate-900">
                    Tambah Publikasi Ilmiah
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                    Catat tesis atau artikel yang sudah diterbitkan,
                    beserta tautan ke sumber aslinya.
                </p>
            </header>
            <PublicationForm maxYear={publicationMaxYear()} />
        </div>
    );
}
