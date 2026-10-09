import { requireSameOriginRequest } from "@/lib/http/origin";
import { toInformasiAkademikDto } from "@/lib/http/dto";
import { createAuditLog } from "@/lib/audit/log";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { readJsonObjectBody } from "@/lib/http/json";
import { db } from "@/prisma/db";

const MAX_INFORMASI_BODY_BYTES = 32 * 1024;
const MAX_JUDUL_LENGTH = 300;
const MAX_DESKRIPSI_LENGTH = 10_000;

export async function GET() {
    try {
        const informasiAkademik =
            await db.orm.public.InformasiAkademik.all();

        return Response.json(informasiAkademik.map(toInformasiAkademikDto));
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

export async function POST(request: Request) {
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

        const created = await db.transaction(async (tx) => {
            const informasi =
                await tx.orm.public.InformasiAkademik.create({
                    judul,
                    deskripsi,
                });

            await createAuditLog({
                userId: user.id,
                action: "CREATE",
                entity: "InformasiAkademik",
                entityId: informasi.id,
                details:
                    `Menambahkan informasi akademik ${informasi.judul}`,
                dbClient: tx,
            });

            return informasi;
        });

        return Response.json(toInformasiAkademikDto(created), { status: 201 });
    } catch (error) {
        console.error(
            "CREATE INFORMASI AKADEMIK ERROR:",
            error
        );

        return Response.json(
            {
                message:
                    "Gagal menambahkan informasi akademik",
            },
            { status: 500 }
        );
    }
}
