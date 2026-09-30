import { createAuditLog } from "@/lib/audit/log";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { db } from "@/prisma/db";

export async function GET() {
    const staff = await db.orm.public.Staff.all();

    return Response.json(staff);
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

        const created = await db.transaction(async (tx) => {
            const staffBaru = await tx.orm.public.Staff.create({
                nama,
                pendidikan: pendidikan || null,
                jabatan,
                lingkupKerja: lingkupKerja || null,
                foto: foto || null,
            });

            await createAuditLog({
                userId: user.id,
                action: "CREATE",
                entity: "Staff",
                entityId: staffBaru.id,
                details: `Menambahkan staff ${staffBaru.nama}`,
                dbClient: tx,
            });

            return staffBaru;
        });

        return Response.json(created, { status: 201 });
    } catch (error) {
        console.error("CREATE STAFF ERROR:", error);

        return Response.json(
            { message: "Gagal menambahkan staff" },
            { status: 500 }
        );
    }
}
