import { requireSameOriginRequest } from "@/lib/http/origin";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { toBeritaDto } from "@/lib/http/dto";
import { db } from "@/prisma/db";
import { createBerita } from "@/lib/berita/management";
import {
    beritaJson,
    beritaErrorResponse,
    readBeritaBody,
} from "@/lib/berita/api";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const berita = await db.orm.public.Berita
            .where({ status: "PUBLISHED" })
            .all();

        return beritaJson(berita.map(toBeritaDto));
    } catch (error) {
        return beritaErrorResponse(error);
    }
}

export async function POST(request: Request) {
    const originError = requireSameOriginRequest(request);
    if (originError) return originError;

    const user = await requireAdminApi();
    if (!user) {
        return beritaJson({ message: "Silakan login kembali." }, 401);
    }

    try {
        const body = await readBeritaBody(request);
        if (!body.ok) return body.response;

        const created = await createBerita(user.id, body.body);
        return beritaJson(toBeritaDto(created), 201);
    } catch (error) {
        return beritaErrorResponse(error);
    }
}
