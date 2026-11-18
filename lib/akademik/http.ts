import { db } from "@/prisma/db";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { hasSqlState } from "@/lib/admin/accounts";
import { toInformasiAkademikDto, toKalenderAkademikDto } from "@/lib/http/dto";
import { requireSameOriginRequest } from "@/lib/http/origin";
import { readJsonObjectBody } from "@/lib/http/json";
import { AcademicError, saveAcademic, type Resource } from "./write";

type AcademicRow = Parameters<typeof toKalenderAkademikDto>[0] |
    Parameters<typeof toInformasiAkademikDto>[0];
export type IdContext = { params: Promise<{ id: string }> };

function dto(row: AcademicRow) {
    return "kegiatan" in row ? toKalenderAkademikDto(row) : toInformasiAkademikDto(row);
}

function json(body: unknown, status = 200) {
    return Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

async function getId(ctx?: IdContext) {
    if (!ctx) return null;
    const { id } = await ctx.params;
    if (!/^[1-9]\d*$/.test(id) || Number(id) > 2147483647) {
        throw new AcademicError(400, "ID tidak valid.");
    }
    return Number(id);
}

function failure(error: unknown) {
    if (error instanceof AcademicError) return json({ message: error.message }, error.status);
    if (hasSqlState(error, "23505")) {
        return json({ message: "Data berubah. Muat ulang lalu coba lagi." }, 409);
    }
    console.error("API akademik:", error instanceof Error ? error.name : "UnknownError");
    return json({ message: "Gagal memproses data akademik." }, 500);
}

export async function readAcademic(resource: Resource, admin: boolean, ctx?: IdContext) {
    try {
        if (admin && !(await requireAdminApi())) return json({ message: "Unauthorized" }, 401);
        const id = await getId(ctx);
        const table = db.orm.public[resource];
        const query = admin ? table : table.where(r => r.status.eq("PUBLISHED"));
        if (id === null) {
            const rows = await query.orderBy(r => r.id.desc()).limit(500).all();
            return json(rows.map(dto));
        }
        const row = await query.where(r => r.id.eq(id)).first();
        return row ? json(dto(row)) : json({ message: "Data tidak ditemukan." }, 404);
    } catch (error) {
        return failure(error);
    }
}

export async function writeAcademic(resource: Resource, request: Request, ctx?: IdContext) {
    try {
        const origin = requireSameOriginRequest(request);
        if (origin) return origin;
        const user = await requireAdminApi();
        if (!user) return json({ message: "Unauthorized" }, 401);
        const id = await getId(ctx);
        const result = await readJsonObjectBody(request, resource === "KalenderAkademik" ? 8192 : 32768);
        if (!result.ok) return result.response;
        const row = await saveAcademic(resource, user.id, id, result.body);
        return json(dto(row), id === null ? 201 : 200);
    } catch (error) {
        return failure(error);
    }
}
