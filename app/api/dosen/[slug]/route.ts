import { createAuditLog } from "@/lib/audit/log";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { db } from "@/prisma/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const dosen = await db.orm.public.Dosen.all();
  const item = dosen.find((dosen) => dosen.slug === slug);

  if (!item) {
    return Response.json({ message: "Dosen tidak ditemukan" }, { status: 404 });
  }

  return Response.json(item);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const user = await requireAdminApi();

  if (!user) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const body = await request.json();

  const { nama, nidn, foto, pendidikan, profil } = body;

  if (!nama || !nidn || !pendidikan) {
    return Response.json(
      { message: "Nama, NIDN, dan pendidikan wajib diisi" },
      { status: 400 },
    );
  }

  if (!["S1", "S2", "S3"].includes(pendidikan)) {
    return Response.json(
      {
        message: "Pendidikan harus S1, S2, atau S3",
      },
      { status: 400 },
    );
  }

  const dosen = await db.orm.public.Dosen.all();
  const item = dosen.find((dosen) => dosen.slug === slug);

  if (!item) {
    return Response.json({ message: "Dosen tidak ditemukan" }, { status: 404 });
  }

  const duplicate = dosen.find(
    (dosen) => dosen.nidn === nidn && dosen.id !== item.id,
  );

  if (duplicate) {
    return Response.json(
      {
        message: `NIDN ${nidn} sudah terdaftar`,
      },
      { status: 400 },
    );
  }

  const updated = await db.transaction(async (tx) => {
    const dosenUpdated = await tx.orm.public.Dosen.where({
      id: item.id,
    }).update({
      nama,
      nidn,
      foto: foto || null,
      pendidikan,
      profil: profil || null,
    });

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

  return Response.json(updated);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const user = await requireAdminApi();

  if (!user) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  const dosen = await db.orm.public.Dosen.all();
  const item = dosen.find((dosen) => dosen.slug === slug);

  if (!item) {
    return Response.json({ message: "Dosen tidak ditemukan" }, { status: 404 });
  }

  await db.transaction(async (tx) => {
    await tx.orm.public.Dosen.where({ id: item.id }).delete();

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
}
