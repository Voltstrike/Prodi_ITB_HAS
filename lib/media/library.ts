import "server-only";
import { db } from "@/prisma/db";
import { dokumenDirectory } from "@/lib/dokumen/storage";
import { mediaDirectory } from "./storage";
import { collectMediaLibraryPage } from "./library-list";
import type { MediaLibraryFilters } from "./library-filters";

export async function getMediaLibraryPage(
    filters: MediaLibraryFilters,
) {
    return collectMediaLibraryPage(filters, {
        imageDirectory: mediaDirectory(),
        documentDirectory: dokumenDirectory(),
        loadDocuments: async () =>
            await db.orm.public.DokumenKurikulum
                .select(
                    "filename",
                    "judul",
                    "namaAsli",
                    "ukuran",
                )
                .all(),
    });
}
