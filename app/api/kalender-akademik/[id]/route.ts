import { createAuditLog } from "@/lib/audit/log";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { db } from "@/prisma/db";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const kalenderId = Number(id);

        if (!Number.isInteger(kalenderId) || kalenderId <= 0) {
            return Response.json(
                { message: "ID tidak valid" },
                { status: 400 }
            );
        }

        const kalenderRows =
            await db.orm.public.KalenderAkademik
                .where({ id: kalenderId })
                .all();

        const kalender = kalenderRows[0];

        if (!kalender) {
            return Response.json(
                { message: "Kalender akademik tidak ditemukan" },
                { status: 404 }
            );
        }

        return Response.json(kalender);
    } catch (error) {
        console.error(
            "GET KALENDER AKADEMIK ERROR:",
            error
        );

        return Response.json(
            { message: "Gagal mengambil kalender akademik" },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const body = await request.json();

        const kegiatan = String(
            body.kegiatan ?? ""
        ).trim();

        const tanggalMulai = String(
            body.tanggalMulai ?? ""
        ).trim();

        const tanggalSelesai = String(
            body.tanggalSelesai ?? ""
        ).trim();

        if (
            !kegiatan ||
            !tanggalMulai ||
            !tanggalSelesai
        ) {
            return Response.json(
                {
                    message:
                        "Kegiatan, tanggal mulai, dan tanggal selesai wajib diisi",
                },
                { status: 400 }
            );
        }

        const existingRows =
            await db.orm.public.KalenderAkademik
                .where({ id: kalenderId })
                .all();
        
        const existing = existingRows[0];

        if (!existing) {
            return Response.json(
                { message: "Kalender akademik tidak ditemukan" },
                { status: 404 }
            );
        }

        const updated = await db.transaction(async (tx) => {
            const kalender =
                await tx.orm.public.KalenderAkademik
                    .where({ id: kalenderId })
                    .update({
                        kegiatan,
                        tanggalMulai,
                        tanggalSelesai,
                    });

            await createAuditLog({
                userId: user.id,
                action: "UPDATE",
                entity: "KalenderAkademik",
                entityId: kalenderId,
                details:
                    `Mengubah kalender akademik dengan ID ${kalenderId}`,
                dbClient: tx,
            });

            return kalender;
        });

        return Response.json(updated);
    } catch (error) {
        console.error(
            "UPDATE KALENDER AKADEMIK ERROR:",
            error
        );

        return Response.json(
            { message: "Gagal mengubah kalender akademik" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const existingRows =
            await db.orm.public.KalenderAkademik
                .where({ id: kalenderId })
                .all();
        
        const existing = existingRows[0];   

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
