import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { parsePositiveInt32 } from "@/lib/http/positive-int32";
import { getAdminPublicationById } from "@/lib/publikasi/queries";
import { publicationMaxYear } from "@/lib/publikasi/validation";
import PublicationForm from "../components/PublicationForm";

export const dynamic = "force-dynamic";

export default async function EditPublicationPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    await requireAdmin();

    const id = parsePositiveInt32((await params).id);
    if (id === null) notFound();

    const publication = await getAdminPublicationById(id);
    if (!publication) notFound();

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
                    Edit Publikasi Ilmiah
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                    Perbarui data dan pengaturan tampil publikasi.
                </p>
            </header>
            <PublicationForm
                initial={publication}
                maxYear={publicationMaxYear()}
            />
        </div>
    );
}
