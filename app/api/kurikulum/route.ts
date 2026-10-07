import { toKurikulumDto } from "@/lib/http/dto";
import { createAuditLog } from "@/lib/audit/log";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { readJsonObjectBody } from "@/lib/http/json";
import { db } from "@/prisma/db";

const MAX_KURIKULUM_BODY_BYTES = 8 * 1024;
const MAX_KODE_LENGTH = 50;
const MAX_NAMA_LENGTH = 300;
const MAX_JENIS_LENGTH = 20;

export async function GET() {
    const kurikulum = await db.orm.public.Kurikulum.all();

    return Response.json(kurikulum.map(toKurikulumDto));
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
            MAX_KURIKULUM_BODY_BYTES
        );

        if (!bodyResult.ok) {
            return bodyResult.response;
        }

        const body = bodyResult.body;

        const kode = String(body.kode ?? "").trim();
        const nama = String(body.nama ?? "").trim();
        const sks = Number(body.sks);
        const semester = Number(body.semester);
        const jenis = String(body.jenis ?? "").trim();

        if (!kode || !nama || !sks || !semester || !jenis) {
            return Response.json(
                {
                    message:
                        "Kode, nama, SKS, semester, dan jenis wajib diisi",
                },
                { status: 400 }
            );
        }

        if (
            kode.length > MAX_KODE_LENGTH ||
            nama.length > MAX_NAMA_LENGTH ||
            jenis.length > MAX_JENIS_LENGTH
        ) {
            return Response.json(
                { message: "Salah satu field melebihi batas panjang" },
                { status: 400 }
            );
        }

        if (!Number.isInteger(sks) || sks <= 0) {
            return Response.json(
                { message: "SKS harus berupa bilangan bulat positif" },
                { status: 400 }
            );
        }

        if (!Number.isInteger(semester) || semester <= 0) {
            return Response.json(
                {
                    message:
                        "Semester harus berupa bilangan bulat positif",
                },
                { status: 400 }
            );
        }

        if (!["Wajib", "Pilihan"].includes(jenis)) {
            return Response.json(
                {
                    message: "Jenis harus Wajib atau Pilihan",
                },
                { status: 400 }
            );
        }

        const duplicate = await db.orm.public.Kurikulum
            .where({ kode })
            .first();

        if (duplicate) {
            return Response.json(
                {
                    message: `Kode ${kode} sudah terdaftar`,
                },
                { status: 400 }
            );
        }

        const created = await db.transaction(async (tx) => {
            const mataKuliah =
                await tx.orm.public.Kurikulum.create({
                    kode,
                    nama,
                    sks,
                    semester,
                    jenis,
                });

            await createAuditLog({
                userId: user.id,
                action: "CREATE",
                entity: "Kurikulum",
                entityId: mataKuliah.id,
                details: `Menambahkan mata kuliah ${mataKuliah.kode} - ${mataKuliah.nama}`,
                dbClient: tx,
            });

            return mataKuliah;
        });

        return Response.json(toKurikulumDto(created), { status: 201 });
    } catch (error) {
        console.error("CREATE KURIKULUM ERROR:", error);

        return Response.json(
            { message: "Gagal menambahkan kurikulum" },
            { status: 500 }
        );
    }
}