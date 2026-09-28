import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { createAuditLog } from "@/lib/audit/log";
import { db } from "@/prisma/db";

function generateSlug(nama: string) {
    return nama
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
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
        const rows = body.rows;

        if (!Array.isArray(rows) || rows.length === 0) {
            return Response.json(
                { message: "Data import tidak boleh kosong" },
                { status: 400 }
            );
        }

        const dosen = await db.orm.public.Dosen.all();

        const existingNidn = new Set(
            dosen.map((item) => item.nidn)
        );

        const batchNidn = new Set<string>();

        for (const row of rows) {
            const nama = String(row.nama ?? "").trim();
            const nidn = String(row.nidn ?? "").trim();
            const pendidikan = String(row.pendidikan ?? "").trim();

            if (!nama || !nidn || !pendidikan) {
                return Response.json(
                    { message: "Nama, NIDN, dan pendidikan wajib diisi" },
                    { status: 400 }
                );
            }

            if (!["S1", "S2", "S3"].includes(pendidikan)) {
                return Response.json(
                    {
                        message:
                            "Pendidikan harus S1, S2, atau S3",
                    },
                    { status: 400 }
                );
            }

            if (existingNidn.has(nidn)) {
                return Response.json(
                    {
                        message: `NIDN ${nidn} sudah terdaftar`,
                    },
                    { status: 400 }
                );
            }

            if (batchNidn.has(nidn)) {
                return Response.json(
                    {
                        message: `NIDN ${nidn} duplicate dalam import`,
                    },
                    { status: 400 }
                );
            }

            batchNidn.add(nidn);
        }

        const existingSlugs = new Set(
            dosen.map((item) => item.slug)
        );

        const imported = [];

        await db.transaction(async (tx) => {
            for (const row of rows) {
                const nama = String(row.nama).trim();
                const nidn = String(row.nidn).trim();
                const pendidikan = String(row.pendidikan).trim();

                const baseSlug = generateSlug(nama);
                let slug = baseSlug;
                let suffix = 2;

                while (existingSlugs.has(slug)) {
                    slug = `${baseSlug}-${suffix}`;
                    suffix += 1;
                }

                existingSlugs.add(slug);

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
                    details: `Import Excel: ${nama} (${nidn})`,
                    dbClient: tx,
                });

                imported.push(dosenBaru);
            }
        });

        return Response.json({
            message: "Import berhasil",
            importedCount: imported.length,
        });
    } catch (error) {
        console.error("IMPORT DOSEN ERROR:", error);

        return Response.json(
            { message: "Gagal melakukan import dosen" },
            { status: 500 }
        );
    }
}
