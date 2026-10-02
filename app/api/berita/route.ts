import { createAuditLog } from "@/lib/audit/log";
import { generateUniqueBeritaSlug } from "@/lib/berita/slug";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { db } from "@/prisma/db";

export async function GET() {
    const berita = await db.orm.public.Berita.all();
    return Response.json(berita);
}

export async function POST(request: Request) {
    const user = await requireAdminApi();

    if (!user) {
        return Response.json(
            { message: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        const body = await request.json();

        const title = String(body.title ?? "").trim();
        const date = String(body.date ?? "").trim();
        const description = String(body.description ?? "").trim();
        const image = String(body.image ?? "").trim();
        const content = String(body.content ?? "").trim();

        if (
            !title ||
            !date ||
            !description ||
            !image ||
            !content
        ) {
            return Response.json(
                { message: "Semua field wajib diisi" },
                { status: 400 }
            );
        }

        const slug = await generateUniqueBeritaSlug(title);

        const created = await db.transaction(async (tx) => {
            const beritaBaru = await tx.orm.public.Berita.create({
                title,
                date,
                description,
                image,
                slug,
                content,
            });

            await createAuditLog({
                userId: user.id,
                action: "CREATE",
                entity: "Berita",
                entityId: beritaBaru.id,
                details: `Menambahkan berita ${beritaBaru.title}`,
                dbClient: tx,
            });

            return beritaBaru;
        });

        return Response.json(created, { status: 201 });
    } catch (error) {
        console.error("CREATE BERITA ERROR:", error);

        if (
            error instanceof Error &&
            error.message.toLowerCase().includes("unique")
        ) {
            return Response.json(
                { message: "Slug berita sudah digunakan" },
                { status: 400 }
            );
        }

        return Response.json(
            { message: "Gagal menambahkan berita" },
            { status: 500 }
        );
    }
}