import { toKegiatanProdiDto } from "@/lib/http/dto";
import { requireSameOriginRequest } from "@/lib/http/origin";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { readJsonObjectBody } from "@/lib/http/json";
import { parseImageSource } from "@/lib/images/source";
import { createAuditLog } from "@/lib/audit/log";
import { validateKegiatanProdiInput } from "@/lib/kegiatan-prodi/validation";
import { generateUniqueKegiatanProdiSlug } from "@/lib/kegiatan-prodi/slug";
import { db } from "@/prisma/db";

const MAX_KEGIATAN_BODY_BYTES = 32 * 1024;

export async function GET() {
    const kegiatan = await db.orm.public.KegiatanProdi.all();

    return Response.json(kegiatan.map(toKegiatanProdiDto));
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
                    message:
                        "Foto harus berupa path lokal /... atau URL HTTP/HTTPS yang valid.",
                },
                { status: 400 }
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

        const slug = await generateUniqueKegiatanProdiSlug(
            data.judul
        );

        const created = await db.transaction(async (tx) => {
            const kegiatanBaru =
                await tx.orm.public.KegiatanProdi.create({
                    ...data,
                    slug,
                });

            await createAuditLog({
                userId: user.id,
                action: "CREATE",
                entity: "KegiatanProdi",
                entityId: kegiatanBaru.id,
                details: `Menambahkan kegiatan ${kegiatanBaru.judul}`,
                dbClient: tx,
            });

            return kegiatanBaru;
        });

        return Response.json(toKegiatanProdiDto(created), { status: 201 });
    } catch (error) {
        console.error("CREATE KEGIATAN PRODI ERROR:", error);

        return Response.json(
            { message: "Gagal menambahkan kegiatan prodi" },
            { status: 500 }
        );
    }
}
