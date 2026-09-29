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
        const pendidikan = String(body.pendidikan ?? "").trim();

        if (!nama || !nidn || !pendidikan) {
            return Response.json(
                { message: "Nama, NIDN, dan pendidikan wajib diisi" },
                { status: 400 }
            );
        }

        if (!["S1", "S2", "S3"].includes(pendidikan)) {
            return Response.json(
                {
                    message: "Pendidikan harus S1, S2, atau S3",
                },
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
                pendidikan,
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