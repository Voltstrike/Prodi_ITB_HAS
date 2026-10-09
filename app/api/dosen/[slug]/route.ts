import { requireSameOriginRequest } from "@/lib/http/origin";
import { toDosenDto } from "@/lib/http/dto";
import { createAuditLog } from "@/lib/audit/log";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { readJsonObjectBody } from "@/lib/http/json";
import { db } from "@/prisma/db";

const MAX_DOSEN_BODY_BYTES = 64 * 1024;
const MAX_NAMA_LENGTH = 200;
const MAX_NIDN_LENGTH = 32;
const MAX_PENDIDIKAN_LENGTH = 500;
const MAX_FOTO_LENGTH = 2048;
const MAX_PROFIL_LENGTH = 10_000;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const item = await db.orm.public.Dosen
      .where({ slug })
      .first();

  if (!item) {
    return Response.json({ message: "Dosen tidak ditemukan" }, { status: 404 });
  }

  return Response.json(toDosenDto(item));
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const originError = requireSameOriginRequest(request);
    if (originError) {
        return originError;
    }

    const user = await requireAdminApi();

    if (!user) {
        return Response.json(
            { message: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        const { slug } = await params;
        const bodyResult = await readJsonObjectBody(
            request,
            MAX_DOSEN_BODY_BYTES
        );

        if (!bodyResult.ok) {
            return bodyResult.response;
        }

        const body = bodyResult.body;

        const nama = String(body.nama ?? "").trim();
        const nidn = String(body.nidn ?? "").trim();
        const foto = String(body.foto ?? "").trim();
        const pendidikanS1 = String(body.pendidikanS1 ?? "").trim();
        const pendidikanS2 = String(body.pendidikanS2 ?? "").trim();
        const pendidikanS3 = String(body.pendidikanS3 ?? "").trim();
        const profil = String(body.profil ?? "").trim();

        if (!nama || !nidn) {
            return Response.json(
                {
                    message: "Nama dan NIDN wajib diisi",
                },
                { status: 400 }
            );
        }

        if (
            nama.length > MAX_NAMA_LENGTH ||
            nidn.length > MAX_NIDN_LENGTH ||
            foto.length > MAX_FOTO_LENGTH ||
            pendidikanS1.length > MAX_PENDIDIKAN_LENGTH ||
            pendidikanS2.length > MAX_PENDIDIKAN_LENGTH ||
            pendidikanS3.length > MAX_PENDIDIKAN_LENGTH ||
            profil.length > MAX_PROFIL_LENGTH
        ) {
            return Response.json(
                { message: "Salah satu field melebihi batas panjang" },
                { status: 400 }
            );
        }

        const item = await db.orm.public.Dosen
            .where({ slug })
            .first();

        if (!item) {
            return Response.json(
                { message: "Dosen tidak ditemukan" },
                { status: 404 }
            );
        }

        const duplicate = await db.orm.public.Dosen
            .where({ nidn })
            .first();

        const hasDuplicate =
            duplicate && duplicate.id !== item.id;

        if (hasDuplicate) {
            return Response.json(
                {
                    message: `NIDN ${nidn} sudah terdaftar`,
                },
                { status: 400 }
            );
        }

        const updated = await db.transaction(async (tx) => {
            const dosenUpdated =
                await tx.orm.public.Dosen
                    .where({ id: item.id })
                    .update({
                        nama,
                        nidn,
                        foto: foto || null,
                        pendidikanS1: pendidikanS1 || null,
                        pendidikanS2: pendidikanS2 || null,
                        pendidikanS3: pendidikanS3 || null,
                        profil: profil || null,
                    });

            if (!dosenUpdated) {
                throw new Error("Data tidak ditemukan saat update.");
            }

            await createAuditLog({
                userId: user.id,
                action: "UPDATE",
                entity: "Dosen",
                entityId: item.id,
                details: `Mengubah data dosen dengan ID ${item.id}`,
                dbClient: tx,
            });

            return dosenUpdated;
        });

        return Response.json(toDosenDto(updated));
    } catch (error) {
        console.error("UPDATE DOSEN ERROR:", error);

        return Response.json(
            { message: "Gagal mengubah data dosen" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const originError = requireSameOriginRequest(request);
    if (originError) {
        return originError;
    }

    const user = await requireAdminApi();

    if (!user) {
        return Response.json(
            { message: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        const { slug } = await params;

        const item = await db.orm.public.Dosen
            .where({ slug })
            .first();

        if (!item) {
            return Response.json(
                { message: "Dosen tidak ditemukan" },
                { status: 404 }
            );
        }

        await db.transaction(async (tx) => {
            await tx.orm.public.Dosen
                .where({ id: item.id })
                .delete();

            await createAuditLog({
                userId: user.id,
                action: "DELETE",
                entity: "Dosen",
                entityId: item.id,
                details: `Menghapus data dosen dengan ID ${item.id}`,
                dbClient: tx,
            });
        });

        return Response.json({
            message: "Dosen berhasil dihapus",
        });
    } catch (error) {
        console.error("DELETE DOSEN ERROR:", error);

        return Response.json(
            { message: "Gagal menghapus data dosen" },
            { status: 500 }
        );
    }
}
