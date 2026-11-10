import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { toBeritaDto } from "@/lib/http/dto";
import { db } from "@/prisma/db";

export const dynamic = "force-dynamic";

type Context = {
    params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, { params }: Context) {
    const headers = { "Cache-Control": "private, no-store" };
    const admin = await requireAdminApi();

    if (!admin) {
        return Response.json(
            { message: "Akses ditolak." },
            { status: 403, headers },
        );
    }

    try {
        const { slug } = await params;
        const item = await db.orm.public.Berita
            .where({ slug })
            .first();

        if (!item) {
            return Response.json(
                { message: "Berita tidak ditemukan." },
                { status: 404, headers },
            );
        }

        return Response.json(toBeritaDto(item), { headers });
    } catch (error) {
        console.error(
            "ADMIN BERITA GET ERROR:",
            error instanceof Error ? error.name : "UnknownError",
        );
        return Response.json(
            { message: "Gagal mengambil berita." },
            { status: 500, headers },
        );
    }
}
