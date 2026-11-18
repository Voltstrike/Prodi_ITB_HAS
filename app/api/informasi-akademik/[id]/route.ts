import { readAcademic, writeAcademic, type IdContext } from "@/lib/akademik/http";
import { requireSameOriginRequest } from "@/lib/http/origin";
import { createAuditLog } from "@/lib/audit/log";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { db } from "@/prisma/db";

export function GET(_request: Request, ctx: IdContext) {
    return readAcademic("InformasiAkademik", false, ctx);
}

export function PUT(request: Request, ctx: IdContext) {
    return writeAcademic("InformasiAkademik", request, ctx);
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
        const informasiId = Number(id);

        if (
            !Number.isInteger(informasiId) ||
            informasiId <= 0
        ) {
            return Response.json(
                { message: "ID tidak valid" },
                { status: 400 }
            );
        }

        const existing =
            await db.orm.public.InformasiAkademik
                .where({ id: informasiId })
                .first();

        if (!existing) {
            return Response.json(
                {
                    message:
                        "Informasi akademik tidak ditemukan",
                },
                { status: 404 }
            );
        }

        await db.transaction(async (tx) => {
            await tx.orm.public.InformasiAkademik
                .where({ id: informasiId })
                .delete();

            await createAuditLog({
                userId: user.id,
                action: "DELETE",
                entity: "InformasiAkademik",
                entityId: informasiId,
                details:
                    `Menghapus informasi akademik ${existing.judul}`,
                dbClient: tx,
            });
        });

        return Response.json({
            message:
                "Informasi akademik berhasil dihapus",
        });
    } catch (error) {
        console.error(
            "DELETE INFORMASI AKADEMIK ERROR:",
            error
        );

        return Response.json(
            {
                message:
                    "Gagal menghapus informasi akademik",
            },
            { status: 500 }
        );
    }
}
