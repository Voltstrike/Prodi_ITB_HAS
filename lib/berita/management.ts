import { db } from "@/prisma/db";
import { createAuditLog } from "@/lib/audit/log";
import { generateUniqueBeritaSlug } from "./slug";
import { isBeritaStatus, validateBeritaInput } from "./validation";

export class BeritaMutationError extends Error {
    constructor(
        readonly status: 400 | 404,
        message: string,
    ) {
        super(message);
        this.name = "BeritaMutationError";
    }
}

export async function createBerita(
    userId: number,
    body: Record<string, unknown>,
) {
    const validation = validateBeritaInput(body);
    if (!validation.ok) {
        throw new BeritaMutationError(400, validation.message);
    }

    const slug = await generateUniqueBeritaSlug(validation.data.title);

    return db.transaction(async (tx) => {
        const created = await tx.orm.public.Berita.create({
            ...validation.data,
            slug,
        });

        await createAuditLog({
            userId,
            action: "CREATE",
            entity: "Berita",
            entityId: created.id,
            details: `Menambahkan berita "${created.title}". Status: ${created.status}.`,
            dbClient: tx,
        });

        return created;
    });
}

export async function updateBerita(
    userId: number,
    slug: string,
    body: Record<string, unknown>,
) {
    return db.transaction(async (tx) => {
        const lock = db.raw.sql`
            SELECT id FROM public."berita"
            WHERE slug = ${slug}
            FOR UPDATE
        `.returnsRow({ id: "pg/int4@1" }).build();

        const rows = await tx.query(lock);
        if (!rows[0]) {
            throw new BeritaMutationError(404, "Berita tidak ditemukan.");
        }

        const existing = await tx.orm.public.Berita
            .where({ id: rows[0].id })
            .first();

        if (!existing) {
            throw new BeritaMutationError(404, "Berita tidak ditemukan.");
        }
        if (!isBeritaStatus(existing.status)) {
            throw new Error("Status berita tersimpan tidak valid.");
        }

        const validation = validateBeritaInput(body, existing.status);
        if (!validation.ok) {
            throw new BeritaMutationError(400, validation.message);
        }

        const data = validation.data;

        await tx.orm.public.Berita
            .where({ id: existing.id })
            .update({
                ...data,
                thumbnail: validation.thumbnailProvided
                    ? data.thumbnail
                    : data.image === existing.image
                        ? existing.thumbnail
                        : null,
            });

        const updated = await tx.orm.public.Berita
            .where({ id: existing.id })
            .first();

        if (!updated) {
            throw new BeritaMutationError(404, "Berita tidak ditemukan.");
        }

        await createAuditLog({
            userId,
            action: "UPDATE",
            entity: "Berita",
            entityId: existing.id,
            details: `Mengubah berita "${updated.title}". Status: ${existing.status} → ${updated.status}.`,
            dbClient: tx,
        });

        return updated;
    });
}

export async function deleteBerita(userId: number, slug: string) {
    return db.transaction(async (tx) => {
        const lock = db.raw.sql`
            SELECT id FROM public."berita"
            WHERE slug = ${slug}
            FOR UPDATE
        `.returnsRow({ id: "pg/int4@1" }).build();

        const rows = await tx.query(lock);
        if (!rows[0]) {
            throw new BeritaMutationError(404, "Berita tidak ditemukan.");
        }

        const existing = await tx.orm.public.Berita
            .where({ id: rows[0].id })
            .select("id", "title")
            .first();

        if (!existing) {
            throw new BeritaMutationError(404, "Berita tidak ditemukan.");
        }

        await tx.orm.public.Berita.where({ id: existing.id }).delete();

        await createAuditLog({
            userId,
            action: "DELETE",
            entity: "Berita",
            entityId: existing.id,
            details: `Menghapus berita "${existing.title}".`,
            dbClient: tx,
        });
    });
}
