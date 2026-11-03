import "dotenv/config";
import { db } from "../prisma/db";
import { readDokumen } from "../lib/dokumen/storage";
import { createPdfThumbnail } from "../lib/dokumen/thumbnail";
import { DokumenUploadError } from "../lib/dokumen/constants";
import { saveMedia } from "../lib/media/storage";

class BackfillError extends Error {}

async function main() {
    let databaseUrl: URL;

    try {
        databaseUrl = new URL(process.env.DATABASE_URL ?? "");
    } catch {
        throw new BackfillError("Konfigurasi database tidak valid.");
    }

    if (
        !["postgres:", "postgresql:"].includes(databaseUrl.protocol) ||
        !["localhost", "127.0.0.1", "[::1]"].includes(databaseUrl.hostname) ||
        databaseUrl.pathname !== "/mm_itbhas"
    ) {
        throw new BackfillError(
            "Skrip hanya diizinkan untuk database mm_itbhas lokal.",
        );
    }

    const currentBeranda = await db.orm.public.Beranda
        .where({ singletonKey: 1 })
        .first();

    if (currentBeranda?.fotoKurikulum?.trim()) {
        console.log("Foto Kurikulum sudah terisi. Tidak ada perubahan.");
        return;
    }

    const dokumen = await db.orm.public.DokumenKurikulum
        .where({ kategori: "KURIKULUM" })
        .orderBy([
            (item) => item.createdAt.desc(),
            (item) => item.id.desc(),
        ])
        .first();

    if (!dokumen) {
        throw new BackfillError("Dokumen Kurikulum belum tersedia.");
    }

    const file = await readDokumen(dokumen.filename);

    if (
        !file?.data ||
        file.data.length !== file.size ||
        file.size !== dokumen.ukuran
    ) {
        throw new BackfillError(
            "Berkas PDF tidak tersedia atau ukurannya tidak sesuai.",
        );
    }

    const preview = await createPdfThumbnail(file.data);

    const result = await db.transaction(async (tx) => {
        const lock = db.raw.sql`
            SELECT id FROM public."beranda"
            WHERE "singletonKey" = 1
            FOR UPDATE
        `.returnsRow({ id: "pg/int4@1" }).build();

        await tx.query(lock);

        const existing = await tx.orm.public.Beranda
            .where({ singletonKey: 1 })
            .first();

        if (existing?.fotoKurikulum?.trim()) return null;

        const filename = await saveMedia(preview.data);
        const fotoKurikulum = `/media/${filename}`;

        const saved = existing
            ? await tx.orm.public.Beranda
                .where({ id: existing.id })
                .update({ fotoKurikulum })
            : await tx.orm.public.Beranda.create({
                singletonKey: 1,
                fotoKurikulum,
            });

        if (!saved) {
            throw new BackfillError(
                "Pratinjau Kurikulum gagal disimpan.",
            );
        }

        return fotoKurikulum;
    });

    if (!result) {
        console.log("Foto Kurikulum sudah diisi oleh proses lain.");
        return;
    }

    console.log("Dokumen sumber:", dokumen.id, dokumen.judul);
    console.log("Pratinjau tersimpan:", result);
    console.log(
        `Ukuran: ${preview.width} x ${preview.height}, ` +
        `${Math.ceil(preview.data.length / 1024)} KB.`,
    );
}

try {
    await main();
} catch (error) {
    if (
        error instanceof BackfillError ||
        error instanceof DokumenUploadError
    ) {
        console.error(error.message);
    } else {
        console.error(
            "Pengisian pratinjau gagal:",
            error instanceof Error ? error.name : "UnknownError",
        );
    }

    process.exitCode = 1;
} finally {
    await db.close();
}
