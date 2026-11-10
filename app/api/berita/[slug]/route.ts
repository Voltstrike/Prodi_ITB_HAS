import { requireSameOriginRequest } from "@/lib/http/origin";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { toBeritaDto } from "@/lib/http/dto";
import { db } from "@/prisma/db";
import {
    updateBerita,
    deleteBerita,
} from "@/lib/berita/management";
import {
    beritaJson,
    beritaErrorResponse,
    readBeritaBody,
} from "@/lib/berita/api";

export const dynamic = "force-dynamic";

type Context = {
    params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, { params }: Context) {
    try {
        const { slug } = await params;
        const item = await db.orm.public.Berita
            .where({ slug, status: "PUBLISHED" })
            .first();

        if (!item) {
            return beritaJson({ message: "Berita tidak ditemukan." }, 404);
        }

        return beritaJson(toBeritaDto(item));
    } catch (error) {
        return beritaErrorResponse(error);
    }
}

export async function PUT(request: Request, { params }: Context) {
    const originError = requireSameOriginRequest(request);
    if (originError) return originError;

    const user = await requireAdminApi();
    if (!user) {
        return beritaJson({ message: "Silakan login kembali." }, 401);
    }

    try {
        const { slug } = await params;
        const body = await readBeritaBody(request);
        if (!body.ok) return body.response;

        const updated = await updateBerita(user.id, slug, body.body);
        return beritaJson(toBeritaDto(updated));
    } catch (error) {
        return beritaErrorResponse(error);
    }
}

export async function DELETE(request: Request, { params }: Context) {
    const originError = requireSameOriginRequest(request);
    if (originError) return originError;

    const user = await requireAdminApi();
    if (!user) {
        return beritaJson({ message: "Silakan login kembali." }, 401);
    }

    try {
        const { slug } = await params;
        await deleteBerita(user.id, slug);
        return beritaJson({ message: "Berita berhasil dihapus." });
    } catch (error) {
        return beritaErrorResponse(error);
    }
}
