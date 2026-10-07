import { createAuditLog } from "@/lib/audit/log";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { readJsonObjectBody } from "@/lib/http/json";
import { db } from "@/prisma/db";

const MAX_KURIKULUM_BODY_BYTES = 8 * 1024;
const MAX_KODE_LENGTH = 50;
const MAX_NAMA_LENGTH = 300;
const MAX_JENIS_LENGTH = 20;

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const kurikulumId = Number(id);

    if (!Number.isSafeInteger(kurikulumId) || kurikulumId <= 0) {
        return Response.json(
            { message: "ID kurikulum tidak valid" },
            { status: 400 }
        );
    }

    const item = await db.orm.public.Kurikulum
        .where({ id: kurikulumId })
        .first();

    if (!item) {
        return Response.json(
            { message: "Kurikulum tidak ditemukan" },
            { status: 404 }
        );
    }

    return Response.json(item);
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await requireAdminApi();

    if (!user) {
        return Response.json(
            { message: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        const { id } = await params;
        const kurikulumId = Number(id);

        if (!Number.isSafeInteger(kurikulumId) || kurikulumId <= 0) {
            return Response.json(
                { message: "ID kurikulum tidak valid" },
                { status: 400 }
            );
        }

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

        const item = await db.orm.public.Kurikulum
            .where({ id: kurikulumId })
            .first();

        if (!item) {
            return Response.json(
                { message: "Kurikulum tidak ditemukan" },
                { status: 404 }
            );
        }

        const duplicate = await db.orm.public.Kurikulum
            .where({ kode })
            .first();

        if (duplicate && duplicate.id !== kurikulumId) {
            return Response.json(
                {
                    message: `Kode ${kode} sudah terdaftar`,
                },
                { status: 400 }
            );
        }

        const updated = await db.transaction(async (tx) => {
            const mataKuliah =
                await tx.orm.public.Kurikulum
                    .where({ id: kurikulumId })
                    .update({
                        kode,
                        nama,
                        sks,
                        semester,
                        jenis,
                    });

            await createAuditLog({
                userId: user.id,
                action: "UPDATE",
                entity: "Kurikulum",
                entityId: kurikulumId,
                details: `Mengubah mata kuliah dengan ID ${kurikulumId}`,
                dbClient: tx,
            });

            return mataKuliah;
        });

        return Response.json(updated);
    } catch (error) {
        console.error("UPDATE KURIKULUM ERROR:", error);

        return Response.json(
            { message: "Gagal mengubah kurikulum" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await requireAdminApi();

    if (!user) {
        return Response.json(
            { message: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        const { id } = await params;
        const kurikulumId = Number(id);

        if (!Number.isSafeInteger(kurikulumId) || kurikulumId <= 0) {
            return Response.json(
                { message: "ID kurikulum tidak valid" },
                { status: 400 }
            );
        }

        const item = await db.orm.public.Kurikulum
            .where({ id: kurikulumId })
            .first();

        if (!item) {
            return Response.json(
                { message: "Kurikulum tidak ditemukan" },
                { status: 404 }
            );
        }

        await db.transaction(async (tx) => {
            await tx.orm.public.Kurikulum
                .where({ id: kurikulumId })
                .delete();

            await createAuditLog({
                userId: user.id,
                action: "DELETE",
                entity: "Kurikulum",
                entityId: kurikulumId,
                details: `Menghapus mata kuliah ${item.kode} - ${item.nama}`,
                dbClient: tx,
            });
        });

        return Response.json({
            message: "Kurikulum berhasil dihapus",
        });
    } catch (error) {
        console.error("DELETE KURIKULUM ERROR:", error);

        return Response.json(
            { message: "Gagal menghapus kurikulum" },
            { status: 500 }
        );
    }
}