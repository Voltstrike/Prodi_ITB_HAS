import { createAuditLog } from "@/lib/audit/log";
import { generateUniqueBeritaSlug } from "@/lib/berita/slug";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { readJsonObjectBody } from "@/lib/http/json";
import { db } from "@/prisma/db";

const MAX_BERITA_BODY_BYTES = 256 * 1024;
const MAX_TITLE_LENGTH = 300;
const MAX_DATE_LENGTH = 64;
const MAX_DESCRIPTION_LENGTH = 5_000;
const MAX_IMAGE_LENGTH = 2_048;
const MAX_CONTENT_LENGTH = 100_000;

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
        const bodyResult = await readJsonObjectBody(
            request,
            MAX_BERITA_BODY_BYTES
        );

        if (!bodyResult.ok) {
            return bodyResult.response;
        }

        const body = bodyResult.body;

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

        if (
            title.length > MAX_TITLE_LENGTH ||
            date.length > MAX_DATE_LENGTH ||
            description.length > MAX_DESCRIPTION_LENGTH ||
            image.length > MAX_IMAGE_LENGTH ||
            content.length > MAX_CONTENT_LENGTH
        ) {
            return Response.json(
                { message: "Salah satu field melebihi batas panjang" },
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