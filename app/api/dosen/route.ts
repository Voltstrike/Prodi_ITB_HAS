import { createAuditLog } from "@/lib/audit/log";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { db } from "@/prisma/db";

export async function GET() {
  const dosen = await db.orm.public.Dosen.all();

  return Response.json(dosen);
}

export async function POST(request: Request) {
  const user = await requireAdminApi();

  if (!user) {
    return Response.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await request.json();

  const {
    nama,
    slug,
    nidn,
    foto,
    pendidikan,
    profil,
  } = body;

  if (!nama || !slug || !nidn || !pendidikan) {
    return Response.json(
      { message: "Nama, NIDN, slug, dan pendidikan wajib diisi" },
      { status: 400 }
    );
  }

  const dosen = await db.orm.public.Dosen.create({
    nama,
    slug,
    nidn,
    foto: foto || null,
    pendidikan,
    profil: profil || null,
  });

  await createAuditLog({
    userId: user.id,
    action: "CREATE",
    entity: "Dosen",
    entityId: dosen.id,
    details: `Menambahkan dosen ${dosen.nama}`,
  });

  return Response.json(dosen, { status: 201 });
}