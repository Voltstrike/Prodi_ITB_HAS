import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { isBeritaStatus } from "@/lib/berita/validation";
import { db } from "@/prisma/db";
import BeritaForm from "../components/BeritaForm";

export const dynamic = "force-dynamic";

export default async function EditBeritaPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    await requireAdmin();

    const { slug } = await params;
    const item = await db.orm.public.Berita.where({ slug }).first();
    if (!item) notFound();
    if (!isBeritaStatus(item.status)) {
        throw new Error("Status berita tersimpan tidak valid.");
    }

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <Link href="/admin/berita" className="text-sm font-medium text-blue-700 hover:underline">
                ← Kembali ke Berita
            </Link>
            <header>
                <h1 className="text-2xl font-bold text-slate-900">Edit Berita</h1>
                <p className="mt-2 text-sm text-slate-600">
                    Status saat ini: {item.status === "DRAFT" ? "Draft" : "Terbit"}.
                </p>
            </header>
            <BeritaForm
                initial={{
                    title: item.title,
                    date: item.date,
                    description: item.description,
                    image: item.image,
                    thumbnail: item.thumbnail,
                    slug: item.slug,
                    content: item.content,
                    status: item.status,
                }}
            />
        </div>
    );
}
