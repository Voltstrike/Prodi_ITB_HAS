import { requireSameOriginRequest } from "@/lib/http/origin";
import { toInformasiAkademikDto } from "@/lib/http/dto";
import { createAuditLog } from "@/lib/audit/log";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { readJsonObjectBody } from "@/lib/http/json";
import { db } from "@/prisma/db";

const MAX_INFORMASI_BODY_BYTES = 32 * 1024;
const MAX_JUDUL_LENGTH = 300;
const MAX_DESKRIPSI_LENGTH = 10_000;

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const informasi =
            await db.orm.public.InformasiAkademik
                .where({ id: informasiId })
                .first();

        if (!informasi) {
            return Response.json(
                {
                    message:
                        "Informasi akademik tidak ditemukan",
                },
                { status: 404 }
            );
        }

        return Response.json(toInformasiAkademikDto(informasi));
    } catch (error) {
        console.error(
            "GET INFORMASI AKADEMIK ERROR:",
            error
        );

        return Response.json(
            {
                message:
                    "Gagal mengambil informasi akademik",
            },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const originError = requireSameOriginRequest(request);
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

        const bodyResult = await readJsonObjectBody(
            request,
            MAX_INFORMASI_BODY_BYTES
        );

        if (!bodyResult.ok) {
            return bodyResult.response;
        }

        const body = bodyResult.body;

        const judul = String(
            body.judul ?? ""
        ).trim();

        const deskripsi = String(
            body.deskripsi ?? ""
        ).trim();

        if (!judul || !deskripsi) {
            return Response.json(
                {
                    message:
                        "Judul dan deskripsi wajib diisi",
                },
                { status: 400 }
            );
        }

        if (
            judul.length > MAX_JUDUL_LENGTH ||
            deskripsi.length > MAX_DESKRIPSI_LENGTH
        ) {
            return Response.json(
                { message: "Salah satu field melebihi batas panjang" },
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

        const updated = await db.transaction(async (tx) => {
            const informasi =
                await tx.orm.public.InformasiAkademik
                    .where({ id: informasiId })
                    .update({
                        judul,
                        deskripsi,
                    });

            if (!informasi) {
                throw new Error("Data tidak ditemukan saat update.");
            }

            await createAuditLog({
                userId: user.id,
                action: "UPDATE",
                entity: "InformasiAkademik",
                entityId: informasiId,
                details:
                    `Mengubah informasi akademik dengan ID ${informasiId}`,
                dbClient: tx,
            });

            return informasi;
        });

        return Response.json(toInformasiAkademikDto(updated));
    } catch (error) {
        console.error(
            "UPDATE INFORMASI AKADEMIK ERROR:",
            error
        );

        return Response.json(
            {
                message:
                    "Gagal mengubah informasi akademik",
            },
            { status: 500 }
        );
    }
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
