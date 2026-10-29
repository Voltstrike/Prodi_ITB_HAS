import { toKegiatanProdiDto } from "@/lib/http/dto";
import { db } from "@/prisma/db";
import { requireSameOriginRequest } from "@/lib/http/origin";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { readJsonObjectBody } from "@/lib/http/json";
import { parseImageSource } from "@/lib/images/source";
import { createAuditLog } from "@/lib/audit/log";
import { validateKegiatanProdiInput } from "@/lib/kegiatan-prodi/validation";

const MAX_KEGIATAN_BODY_BYTES = 32 * 1024;

interface KegiatanProdiDetailRouteProps {
    params: Promise<{
        slug: string;
    }>;
}

export async function GET(
    _request: Request,
    { params }: KegiatanProdiDetailRouteProps
) {
    const { slug } = await params;

    const kegiatan = await db.orm.public.KegiatanProdi
        .where({ slug })
        .first();

    if (!kegiatan) {
        return Response.json(
            { message: "Kegiatan Prodi tidak ditemukan" },
            { status: 404 }
        );
    }

    return Response.json(toKegiatanProdiDto(kegiatan));
}

export async function PUT(
    request: Request,
    { params }: KegiatanProdiDetailRouteProps
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

    const { slug } = await params;

    try {
        const bodyResult = await readJsonObjectBody(
            request,
            MAX_KEGIATAN_BODY_BYTES
        );

        if (!bodyResult.ok) {
            return bodyResult.response;
        }

        const validation = validateKegiatanProdiInput(
            bodyResult.body
        );

        if (!validation.ok) {
            return Response.json(
                { message: validation.message },
                { status: 400 }
            );
        }

        const data = validation.data;

        if (data.foto && parseImageSource(data.foto) === null) {
            return Response.json(
                {
                    message: "Foto harus berupa path lokal atau URL HTTP/HTTPS yang valid"
                },
                { status: 400 }
            );
        }

        const kegiatan = await db.orm.public.KegiatanProdi
            .where({ slug })
            .first();

        if (!kegiatan) {
            return Response.json(
                { message: "Kegiatan Prodi tidak ditemukan" },
                { status: 404 }
            );
        }

        const dosen = await db.orm.public.Dosen
            .where({ id: data.dosenId })
            .first();

        if (!dosen) {
            return Response.json(
                { message: "Dosen tidak ditemukan" },
                { status: 400 }
            );
        }

        const updated = await db.transaction(async (tx) => {
            const kegiatanUpdated =
                await tx.orm.public.KegiatanProdi
                    .where({ id: kegiatan.id })
                    .update(data);

            if (!kegiatanUpdated) {
                throw new Error("Kegiatan gagal diperbarui");
            }

            await createAuditLog({
                userId: user.id,
                action: "UPDATE",
                entity: "KegiatanProdi",
                entityId: kegiatan.id,
                details: `Mengubah kegiatan ${kegiatanUpdated.judul}`,
                dbClient: tx,
            });

            return kegiatanUpdated;
        });

        return Response.json(toKegiatanProdiDto(updated));
    } catch (error) {
        console.error("UPDATE KEGIATAN PRODI ERROR:", error);

        return Response.json(
            { message: "Gagal mengubah kegiatan prodi" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: KegiatanProdiDetailRouteProps
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

    const { slug } = await params;

    try {
        const kegiatan = await db.orm.public.KegiatanProdi
            .where({ slug })
            .first();

        if (!kegiatan) {
            return Response.json(
                { message: "Kegiatan Prodi tidak ditemukan" },
                { status: 404 }
            );
        }

        await db.transaction(async (tx) => {
            await tx.orm.public.KegiatanProdi
                .where({ id: kegiatan.id })
                .delete();

            await createAuditLog({
                userId: user.id,
                action: "DELETE",
                entity: "KegiatanProdi",
                entityId: kegiatan.id,
                details: `Menghapus kegiatan ${kegiatan.judul}`,
                dbClient: tx,
            });
        });

        return Response.json({
            message: "Kegiatan Prodi berhasil dihapus",
        });
    } catch (error) {
        console.error("DELETE KEGIATAN PRODI ERROR:", error);

        return Response.json(
            { message: "Gagal menghapus kegiatan prodi" },
            { status: 500 }
        );
    }
}
