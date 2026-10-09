import { requireSameOriginRequest } from "@/lib/http/origin";
import { toDosenDto } from "@/lib/http/dto";
import { generateDosenSlug } from "@/lib/dosen/slug";
import { createAuditLog } from "@/lib/audit/log";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { readJsonObjectBody } from "@/lib/http/json";
import { db } from "@/prisma/db";

const MAX_DOSEN_BODY_BYTES = 32 * 1024;
const MAX_NAMA_LENGTH = 200;
const MAX_NIDN_LENGTH = 32;
const MAX_PENDIDIKAN_LENGTH = 500;

export async function GET() {
    const dosen = await db.orm.public.Dosen.all();

    return Response.json(dosen.map(toDosenDto));
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
            MAX_DOSEN_BODY_BYTES
        );

        if (!bodyResult.ok) {
            return bodyResult.response;
        }

        const body = bodyResult.body;

        const nama = String(body.nama ?? "").trim();
        const nidn = String(body.nidn ?? "").trim();
        const pendidikanS1 = String(body.pendidikanS1 ?? "").trim();
        const pendidikanS2 = String(body.pendidikanS2 ?? "").trim();
        const pendidikanS3 = String(body.pendidikanS3 ?? "").trim();

        if (!nama || !nidn) {
            return Response.json(
                { message: "Nama dan NIDN wajib diisi" },
                { status: 400 }
            );
        }

        if (
            nama.length > MAX_NAMA_LENGTH ||
            nidn.length > MAX_NIDN_LENGTH ||
            pendidikanS1.length > MAX_PENDIDIKAN_LENGTH ||
            pendidikanS2.length > MAX_PENDIDIKAN_LENGTH ||
            pendidikanS3.length > MAX_PENDIDIKAN_LENGTH
        ) {
            return Response.json(
                { message: "Salah satu field melebihi batas panjang" },
                { status: 400 }
            );
        }

        const duplicate = await db.orm.public.Dosen
            .where({ nidn })
            .first();

        if (duplicate) {
            return Response.json(
                {
                    message: `NIDN ${nidn} sudah terdaftar`,
                },
                { status: 400 }
            );
        }

        const baseSlug = generateDosenSlug(nama);
        let slug = baseSlug;
        let suffix = 2;

        while (
            await db.orm.public.Dosen
                .where({ slug })
                .first()
        ) {
            slug = `${baseSlug}-${suffix}`;
            suffix += 1;
        }

        const created = await db.transaction(async (tx) => {
            const dosenBaru = await tx.orm.public.Dosen.create({
                nama,
                slug,
                nidn,           
                pendidikanS1: pendidikanS1 || null,
                pendidikanS2: pendidikanS2 || null,
                pendidikanS3: pendidikanS3 || null,
            });

            await createAuditLog({
                userId: user.id,
                action: "CREATE",
                entity: "Dosen",
                entityId: dosenBaru.id,
                details: `Menambahkan dosen ${dosenBaru.nama}`,
                dbClient: tx,
            });

            return dosenBaru;
        });

        return Response.json(toDosenDto(created), { status: 201 });
    } catch (error) {
        console.error("CREATE DOSEN ERROR:", error);

        return Response.json(
            { message: "Gagal menambahkan dosen" },
            { status: 500 }
        );
    }
}