import { toStaffDto } from "@/lib/http/dto";
import { createAuditLog } from "@/lib/audit/log";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { readJsonObjectBody } from "@/lib/http/json";
import { db } from "@/prisma/db";

const MAX_STAFF_BODY_BYTES = 32 * 1024;
const MAX_NAMA_LENGTH = 200;
const MAX_PENDIDIKAN_LENGTH = 500;
const MAX_JABATAN_LENGTH = 200;
const MAX_LINGKUP_KERJA_LENGTH = 2000;
const MAX_FOTO_LENGTH = 2048;

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const staffId = Number(id);

    if (!Number.isInteger(staffId)) {
        return Response.json(
            { message: "ID staff tidak valid" },
            { status: 400 }
        );
    }

    const item = await db.orm.public.Staff
        .where({ id: staffId })
        .first();

    if (!item) {
        return Response.json(
            { message: "Staff tidak ditemukan" },
            { status: 404 }
        );
    }

    return Response.json(toStaffDto(item));
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
        const staffId = Number(id);

        if (!Number.isInteger(staffId)) {
            return Response.json(
                { message: "ID staff tidak valid" },
                { status: 400 }
            );
        }

        const bodyResult = await readJsonObjectBody(
            request,
            MAX_STAFF_BODY_BYTES
        );

        if (!bodyResult.ok) {
            return bodyResult.response;
        }

        const body = bodyResult.body;

        const nama = String(body.nama ?? "").trim();
        const pendidikan = String(body.pendidikan ?? "").trim();
        const jabatan = String(body.jabatan ?? "").trim();
        const lingkupKerja = String(body.lingkupKerja ?? "").trim();
        const foto = String(body.foto ?? "").trim();

        if (!nama || !jabatan) {
            return Response.json(
                { message: "Nama dan jabatan wajib diisi" },
                { status: 400 }
            );
        }

        if (
            nama.length > MAX_NAMA_LENGTH ||
            pendidikan.length > MAX_PENDIDIKAN_LENGTH ||
            jabatan.length > MAX_JABATAN_LENGTH ||
            lingkupKerja.length > MAX_LINGKUP_KERJA_LENGTH ||
            foto.length > MAX_FOTO_LENGTH
        ) {
            return Response.json(
                { message: "Salah satu field melebihi batas panjang" },
                { status: 400 }
            );
        }

        const item = await db.orm.public.Staff
            .where({ id: staffId })
            .first();

        if (!item) {
            return Response.json(
                { message: "Staff tidak ditemukan" },
                { status: 404 }
            );
        }

        const updated = await db.transaction(async (tx) => {
            const staffUpdated =
                await tx.orm.public.Staff
                    .where({ id: item.id })
                    .update({
                        nama,
                        pendidikan: pendidikan || null,
                        jabatan,
                        lingkupKerja: lingkupKerja || null,
                        foto: foto || null,
                    });

            if (!staffUpdated) {
                throw new Error("Data tidak ditemukan saat update.");
            }

            await createAuditLog({
                userId: user.id,
                action: "UPDATE",
                entity: "Staff",
                entityId: item.id,
                details: `Mengubah data staff dengan ID ${item.id}`,
                dbClient: tx,
            });

            return staffUpdated;
        });

        return Response.json(toStaffDto(updated));
    } catch (error) {
        console.error("UPDATE STAFF ERROR:", error);

        return Response.json(
            { message: "Gagal mengubah data staff" },
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
        const staffId = Number(id);

        if (!Number.isInteger(staffId)) {
            return Response.json(
                { message: "ID staff tidak valid" },
                { status: 400 }
            );
        }

        const item = await db.orm.public.Staff
            .where({ id: staffId })
            .first();

        if (!item) {
            return Response.json(
                { message: "Staff tidak ditemukan" },
                { status: 404 }
            );
        }

        await db.transaction(async (tx) => {
            await tx.orm.public.Staff
                .where({ id: item.id })
                .delete();

            await createAuditLog({
                userId: user.id,
                action: "DELETE",
                entity: "Staff",
                entityId: item.id,
                details: `Menghapus data staff dengan ID ${item.id}`,
                dbClient: tx,
            });
        });

        return Response.json({
            message: "Staff berhasil dihapus",
        });
    } catch (error) {
        console.error("DELETE STAFF ERROR:", error);

        return Response.json(
            { message: "Gagal menghapus data staff" },
            { status: 500 }
        );
    }
}