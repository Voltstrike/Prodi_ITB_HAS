import { requireAdmin } from "@/lib/auth/require-admin";
import MediaLibraryBrowser from "@/components/admin/MediaLibraryBrowser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function MediaLibraryPage() {
    await requireAdmin();

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">
                    Pustaka Media
                </h1>

                <p className="mt-2 text-sm text-slate-600">
                    Lihat gambar dan dokumen PDF yang sudah
                    diunggah. Untuk memakai gambar pada berita,
                    pilih dari formulir berita.
                </p>
            </div>

            <MediaLibraryBrowser />
        </div>
    );
}
