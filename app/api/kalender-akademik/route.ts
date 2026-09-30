import { createAuditLog } from "@/lib/audit/log";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { db } from "@/prisma/db";

export async function GET() {
    const kalenderAkademik =
        await db.orm.public.KalenderAkademik.all();

    return Response.json(kalenderAkademik);
}

export async function POST(request: Request) {
    const user = await requireAdminApi();

    if (!user) {
        return Response.json(
            { message: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
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

        const created = await db.transaction(async (tx) => {
            const kegiatanBaru =
                await tx.orm.public.KalenderAkademik.create({
                    kegiatan,
                    tanggalMulai,
                    tanggalSelesai,
                });

            await createAuditLog({
                userId: user.id,
                action: "CREATE",
                entity: "KalenderAkademik",
                entityId: kegiatanBaru.id,
                details: `Menambahkan kegiatan ${kegiatanBaru.kegiatan}`,
                dbClient: tx,
            });

            return kegiatanBaru;
        });

        return Response.json(created, { status: 201 });
    } catch (error) {
        console.error(
            "CREATE KALENDER AKADEMIK ERROR:",
            error
        );

        return Response.json(
            {
                message:
                    "Gagal menambahkan kalender akademik",
            },
            { status: 500 }
        );
    }
}
