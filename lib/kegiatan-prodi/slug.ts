import { db } from "@/prisma/db";

function slugify(value: string): string {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

export async function generateUniqueKegiatanProdiSlug(
    title: string
): Promise<string> {
    const baseSlug = slugify(title) || "kegiatan";
    let slug = baseSlug;
    let counter = 2;

    while (
        await db.orm.public.KegiatanProdi
            .where({ slug })
            .first()
    ) {
        slug = `${baseSlug}-${counter}`;
        counter++;
    }

    return slug;
}
