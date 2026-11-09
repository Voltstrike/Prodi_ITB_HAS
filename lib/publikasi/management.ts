import { randomBytes } from "node:crypto";
import { db } from "@/prisma/db";
import { createAuditLog } from "@/lib/audit/log";
import { type PublikasiInput } from "./validation";
import { toPublicationDto } from "./queries";

export class PublicationNotFoundError extends Error {
    constructor() {
        super("Publikasi tidak ditemukan.");
        this.name = "PublicationNotFoundError";
    }
}

function publicationSlug(judul: string): string {
    const base = judul
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 100)
        .replace(/-+$/g, "");

    return `${base || "publikasi"}-${randomBytes(8).toString("hex")}`;
}

export async function createPublication(
    userId: number,
    data: PublikasiInput,
) {
    return db.transaction(async (tx) => {
        const created = await tx.orm.public.PublikasiIlmiah.create({
            ...data,
            slug: publicationSlug(data.judul),
        });

        await createAuditLog({
            userId,
            action: "CREATE",
            entity: "PublikasiIlmiah",
            entityId: created.id,
            details: `Menambahkan publikasi "${created.judul}". Status website: ${
                created.ditampilkan ? "ditampilkan" : "tersembunyi"
            }.`,
            dbClient: tx,
        });

        return toPublicationDto(created);
    });
}

export async function updatePublication(
    userId: number,
    id: number,
    data: PublikasiInput,
) {
    return db.transaction(async (tx) => {
        const lock = db.raw.sql`
            SELECT id
            FROM public."publikasiIlmiah"
            WHERE id = ${id}
            FOR UPDATE
        `.returnsRow({ id: "pg/int4@1" }).build();

        const rows = await tx.query(lock);
        if (!rows[0]) throw new PublicationNotFoundError();

        await tx.orm.public.PublikasiIlmiah
            .where({ id })
            .update(data);

        const updated = await tx.orm.public.PublikasiIlmiah
            .where({ id })
            .first();

        if (!updated) throw new PublicationNotFoundError();

        await createAuditLog({
            userId,
            action: "UPDATE",
            entity: "PublikasiIlmiah",
            entityId: id,
            details: `Mengubah publikasi "${updated.judul}". Status website: ${
                updated.ditampilkan ? "ditampilkan" : "tersembunyi"
            }.`,
            dbClient: tx,
        });

        return toPublicationDto(updated);
    });
}

export async function deletePublication(
    userId: number,
    id: number,
) {
    return db.transaction(async (tx) => {
        const lock = db.raw.sql`
            SELECT id
            FROM public."publikasiIlmiah"
            WHERE id = ${id}
            FOR UPDATE
        `.returnsRow({ id: "pg/int4@1" }).build();

        const rows = await tx.query(lock);
        if (!rows[0]) throw new PublicationNotFoundError();

        const existing = await tx.orm.public.PublikasiIlmiah
            .where({ id })
            .select("id", "judul")
            .first();

        if (!existing) throw new PublicationNotFoundError();

        await tx.orm.public.PublikasiIlmiah.where({ id }).delete();

        await createAuditLog({
            userId,
            action: "DELETE",
            entity: "PublikasiIlmiah",
            entityId: id,
            details: `Menghapus publikasi "${existing.judul}" dari katalog website.`,
            dbClient: tx,
        });
    });
}
