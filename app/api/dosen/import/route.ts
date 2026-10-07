import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { createAuditLog } from "@/lib/audit/log";
import { readJsonObjectBody } from "@/lib/http/json";
import { db } from "@/prisma/db";

const MAX_IMPORT_BODY_BYTES = 512 * 1024;
const MAX_IMPORT_ROWS = 500;
const MAX_NAMA_LENGTH = 200;
const MAX_NIDN_LENGTH = 32;
const MAX_PENDIDIKAN_LENGTH = 500;

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
        const bodyResult = await readJsonObjectBody(
            request,
            MAX_IMPORT_BODY_BYTES
        );

        if (!bodyResult.ok) {
            return bodyResult.response;
        }

        const rows = bodyResult.body.rows;

        if (!Array.isArray(rows) || rows.length === 0) {
            return Response.json(
                { message: "Data import tidak boleh kosong" },
                { status: 400 }
            );
        }

        if (rows.length > MAX_IMPORT_ROWS) {
            return Response.json(
                {
                    message:
                        `Import maksimal ${MAX_IMPORT_ROWS} baris sekali proses`,
                },
                { status: 400 }
            );
        }

        const dosen = await db.orm.public.Dosen.all();

        const existingNidn = new Set(
            dosen.map((item) => item.nidn)
        );

        const batchNidn = new Set<string>();

        for (const row of rows) {
            if (
                !row ||
                typeof row !== "object" ||
                Array.isArray(row)
            ) {
                return Response.json(
                    { message: "Format baris import tidak valid" },
                    { status: 400 }
                );
            }

            const item = row as Record<string, unknown>;

            const nama = String(item.nama ?? "").trim();
            const nidn = String(item.nidn ?? "").trim();
            const pendidikanS1 =
                String(item.pendidikanS1 ?? "").trim();
            const pendidikanS2 =
                String(item.pendidikanS2 ?? "").trim();
            const pendidikanS3 =
                String(item.pendidikanS3 ?? "").trim();

            if (!nama || !nidn) {
                return Response.json(
                    {
                        message:
                            "Nama dan NIDN wajib diisi",
                    },
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
                    {
                        message:
                            "Salah satu field import melebihi batas panjang",
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

            void pendidikanS1;
            void pendidikanS2;
            void pendidikanS3;
        }

        const existingSlugs = new Set(
            dosen.map((item) => item.slug)
        );

        const imported = [];

        await db.transaction(async (tx) => {
            for (const row of rows) {
                const nama = String(row.nama).trim();
                const nidn = String(row.nidn).trim();
                const pendidikanS1 =
                    String(row.pendidikanS1 ?? "").trim();
                const pendidikanS2 =
                    String(row.pendidikanS2 ?? "").trim();
                const pendidikanS3 =
                    String(row.pendidikanS3 ?? "").trim();

                const baseSlug = generateSlug(nama);
                let slug = baseSlug;
                let suffix = 2;

                while (existingSlugs.has(slug)) {
                    slug = `${baseSlug}-${suffix}`;
                    suffix += 1;
                }

                existingSlugs.add(slug);

                const dosenBaru =
                    await tx.orm.public.Dosen.create({
                        nama,
                        slug,
                        nidn,
                        pendidikanS1:
                            pendidikanS1 || null,
                        pendidikanS2:
                            pendidikanS2 || null,
                        pendidikanS3:
                            pendidikanS3 || null,
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