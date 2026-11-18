import { readAcademic, writeAcademic, type IdContext } from "@/lib/akademik/http";
import { requireSameOriginRequest } from "@/lib/http/origin";
import { createAuditLog } from "@/lib/audit/log";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { db } from "@/prisma/db";

export function GET(_request: Request, ctx: IdContext) {
    return readAcademic("KalenderAkademik", false, ctx);
}

export function PUT(request: Request, ctx: IdContext) {
    return writeAcademic("KalenderAkademik", request, ctx);
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const originError = requireSameOriginRequest(_request);
    if (originError) {
        return originError;
    }

    const user = await requireAdminApi();

    if (!user) {
        return Response.json(
            { message: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        const { id } = await params;
        const kalenderId = Number(id);

        if (!Number.isInteger(kalenderId) || kalenderId <= 0) {
            return Response.json(
                { message: "ID tidak valid" },
                { status: 400 }
            );
        }

        const existing =
            await db.orm.public.KalenderAkademik
                .where({ id: kalenderId })
                .first();   

        if (!existing) {
            return Response.json(
                { message: "Kalender akademik tidak ditemukan" },
                { status: 404 }
            );
        }

        await db.transaction(async (tx) => {
            await tx.orm.public.KalenderAkademik
                .where({ id: kalenderId })
                .delete();

            await createAuditLog({
                userId: user.id,
                action: "DELETE",
                entity: "KalenderAkademik",
                entityId: kalenderId,
                details:
                    `Menghapus kegiatan ${existing.kegiatan}`,
                dbClient: tx,
            });
        });

        return Response.json({
            message: "Kalender akademik berhasil dihapus",
        });
    } catch (error) {
        console.error(
            "DELETE KALENDER AKADEMIK ERROR:",
            error
        );

        return Response.json(
            { message: "Gagal menghapus kalender akademik" },
            { status: 500 }
        );
    }
}
