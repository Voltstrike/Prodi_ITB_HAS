import { createAuditLog } from "@/lib/audit/log";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { db } from "@/prisma/db";

function generateSlug(nama: string) {
    return nama
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export async function GET() {
    const dosen = await db.orm.public.Dosen.all();

    return Response.json(dosen);
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

        const dosen = await db.orm.public.Dosen.all();

        if (dosen.some((item) => item.nidn === nidn)) {
            return Response.json(
                {
                    message: `NIDN ${nidn} sudah terdaftar`,
                },
                { status: 400 }
            );
        }

        const existingSlugs = new Set(
            dosen.map((item) => item.slug)
        );

        const baseSlug = generateSlug(nama);
        let slug = baseSlug;
        let suffix = 2;

        while (existingSlugs.has(slug)) {
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

        return Response.json(created, { status: 201 });
    } catch (error) {
        console.error("CREATE DOSEN ERROR:", error);

        return Response.json(
            { message: "Gagal menambahkan dosen" },
            { status: 500 }
        );
    }
}