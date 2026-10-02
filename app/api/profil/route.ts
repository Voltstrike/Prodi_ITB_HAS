import { NextResponse } from "next/server";
import { db } from "@/prisma/db";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { createAuditLog } from "@/lib/audit/log";

export async function GET() {
    const profil = (await db.orm.public.Profil.all())[0] ?? null;

    return NextResponse.json(profil);
}

export async function PUT(request: Request) {
    const admin = await requireAdminApi();

    if (!admin){
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 },
        );
    }

    try {
        const body = await request.json();

        const sejarah =
            typeof body.sejarah === "string" ? body.sejarah.trim() : "";
        const visi =
            typeof body.visi === "string" ? body.visi.trim() : "";
        const misi =
            typeof body.misi === "string" ? body.misi.trim() : "";

        const struktur =
            typeof body.struktur === "string"
                ? body.struktur.trim()
                : null;

        const akreditasi =
            typeof body.akreditasi === "string"
                ? body.akreditasi.trim()
                : null;

        const dokumenAkreditasi =
            typeof body.dokumenAkreditasi === "string"
                ? body.dokumenAkreditasi.trim()
                : null;

        if (!sejarah || !visi || !misi) {
            return NextResponse.json(
                {
                    error: "Sejarah, visi, dan misi wajib diisi.",
                },
                { status: 400 },
            );
        }

        const existing = (await db.orm.public.Profil.all())[0];

        if (!existing) {
            const profil = await db.orm.public.Profil.create({
                sejarah,
                visi,
                misi,
                struktur,
                akreditasi,
                dokumenAkreditasi,
            });

            await createAuditLog({
                userId: admin.id,
                action: "CREATE",
                entity: "Profil",
                entityId: profil.id,
                details: "Membuat profil program studi.",
            });

            return NextResponse.json(profil, { status: 201 });
        }

        const profil = await db.orm.public.Profil
            .where({ id: existing.id })
            .update({
                sejarah,
                visi,
                misi,
                struktur,
                akreditasi,
                dokumenAkreditasi,
            });

        await createAuditLog({
            userId: admin.id,
            action: "UPDATE",
            entity: "Profil",
            entityId: existing.id,
            details: "Memperbarui profil program studi.",
        });

        return NextResponse.json(profil);
    } catch (error) {
        console.error("PUT /api/profil error:", error);

        return NextResponse.json(
            { error: "Gagal menyimpan profil." },
            { status: 500 },
        );
    }
}
