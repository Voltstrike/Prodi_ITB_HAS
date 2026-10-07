import { createAuditLog } from "@/lib/audit/log";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { readJsonObjectBody } from "@/lib/http/json";
import { db } from "@/prisma/db";

const MAX_KALENDER_BODY_BYTES = 8 * 1024;
const MAX_KEGIATAN_LENGTH = 500;
const MAX_TANGGAL_LENGTH = 64;

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
        const bodyResult = await readJsonObjectBody(
            request,
            MAX_KALENDER_BODY_BYTES
        );

        if (!bodyResult.ok) {
            return bodyResult.response;
        }

        const body = bodyResult.body;

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

        if (
            kegiatan.length > MAX_KEGIATAN_LENGTH ||
            tanggalMulai.length > MAX_TANGGAL_LENGTH ||
            tanggalSelesai.length > MAX_TANGGAL_LENGTH
        ) {
            return Response.json(
                { message: "Salah satu field melebihi batas panjang" },
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
