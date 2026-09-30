import { createAuditLog } from "@/lib/audit/log";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { db } from "@/prisma/db";

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

    const staff = await db.orm.public.Staff.all();
    const item = staff.find((staff) => staff.id === staffId);

    if (!item) {
        return Response.json(
            { message: "Staff tidak ditemukan" },
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
        const staffId = Number(id);

        if (!Number.isInteger(staffId)) {
            return Response.json(
                { message: "ID staff tidak valid" },
                { status: 400 }
            );
        }

        const body = await request.json();

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

        const staff = await db.orm.public.Staff.all();
        const item = staff.find((staff) => staff.id === staffId);

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

        return Response.json(updated);
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

        const staff = await db.orm.public.Staff.all();
        const item = staff.find((staff) => staff.id === staffId);

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