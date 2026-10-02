import { createAuditLog } from "@/lib/audit/log";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { db } from "@/prisma/db";

interface BeritaDetailRouteProps {
    params: Promise<{
        slug: string;
    }>;
}

export async function GET(
    request: Request,
    { params }: BeritaDetailRouteProps
) {
    const { slug } = await params;

    const berita = await db.orm.public.Berita.all();
    const item = berita.find((b) => b.slug === slug);

    if (!item) {
        return Response.json(
            { message: "Berita tidak ditemukan" },
            { status: 404 }
        );
    }

    return Response.json(item);
}

export async function PUT(
    request: Request,
    { params }: BeritaDetailRouteProps
) {
    const user = await requireAdminApi();

    if (!user) {
        return Response.json(
            { message: "Unauthorized" },
            { status: 401 }
        );
    }

    const { slug } = await params;

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

        const berita = await db.orm.public.Berita.all();
        const item = berita.find((b) => b.slug === slug);

        if (!item) {
            return Response.json(
                { message: "Berita tidak ditemukan" },
                { status: 404 }
            );
        }

        const updated = await db.transaction(async (tx) => {
            const beritaUpdated = await tx.orm.public.Berita
                .where({ id: item.id })
                .update({
                    title,
                    date,
                    description,
                    image,
                    content,
                });

            if (!beritaUpdated) {
                throw new Error("Berita gagal diperbarui");
            }

            await createAuditLog({
                userId: user.id,
                action: "UPDATE",
                entity: "Berita",
                entityId: item.id,
                details: `Mengubah berita ${beritaUpdated.title}`,
                dbClient: tx,
            });

            return beritaUpdated;
        });

        return Response.json(updated);
    } catch (error) {
        console.error("UPDATE BERITA ERROR:", error);

        return Response.json(
            { message: "Gagal mengubah berita" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: BeritaDetailRouteProps
) {
    const user = await requireAdminApi();

    if (!user) {
        return Response.json(
            { message: "Unauthorized" },
            { status: 401 }
        );
    }

    const { slug } = await params;

    try {
        const berita = await db.orm.public.Berita.all();
        const item = berita.find((b) => b.slug === slug);

        if (!item) {
            return Response.json(
                { message: "Berita tidak ditemukan" },
                { status: 404 }
            );
        }

        await db.transaction(async (tx) => {
            await tx.orm.public.Berita
                .where({ id: item.id })
                .delete();

            await createAuditLog({
                userId: user.id,
                action: "DELETE",
                entity: "Berita",
                entityId: item.id,
                details: `Menghapus berita ${item.title}`,
                dbClient: tx,
            });
        });

        return Response.json({
            message: "Berita berhasil dihapus",
        });
    } catch (error) {
        console.error("DELETE BERITA ERROR:", error);

        return Response.json(
            { message: "Gagal menghapus berita" },
            { status: 500 }
        );
    }
}