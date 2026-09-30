import { createAuditLog } from "@/lib/audit/log";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { db } from "@/prisma/db";

export async function GET() {
    try {
        const informasiAkademik =
            await db.orm.public.InformasiAkademik.all();

        return Response.json(informasiAkademik);
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
    const user = await requireAdminApi();

    if (!user) {
        return Response.json(
            { message: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        const body = await request.json();

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

        return Response.json(created, { status: 201 });
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
