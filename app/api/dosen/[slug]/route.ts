import { requireAdmin } from "@/lib/auth/require-admin";
import { db } from "@/prisma/db";

interface DosenDetailRouteProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function GET(
  request: Request,
  { params }: DosenDetailRouteProps
) {
  const { slug } = await params;

  const dosen = await db.orm.public.Dosen.all();
  const item = dosen.find((d) => d.slug === slug);

  if (!item) {
    return Response.json(
      { message: "Dosen tidak ditemukan" },
      { status: 404 }
    );
  }

  return Response.json(item);
}

export async function PUT(
  request: Request,
  { params }: DosenDetailRouteProps
) {
  await requireAdmin();

  const { slug } = await params;
  const body = await request.json();

  const {
    nama,
    nidn,
    jabatan,
    bidangKeahlian,
    foto,
    email,
    pendidikan,
    profil,
  } = body;

  if (
    !nama ||
    !nidn ||
    !jabatan ||
    !bidangKeahlian ||
    !foto ||
    !email ||
    !pendidikan ||
    !profil
  ) {
    return Response.json(
      { message: "Semua field wajib diisi" },
      { status: 400 }
    );
  }

  const dosen = await db.orm.public.Dosen.all();
  const item = dosen.find((d) => d.slug === slug);

  if (!item) {
    return Response.json(
      { message: "Dosen tidak ditemukan" },
      { status: 404 }
    );
  }

  const updated = await db.orm.public.Dosen
  .where({ id: item.id })
  .update({
    nama,
    nidn,
    jabatan,
    bidangKeahlian,
    foto,
    email,
    pendidikan,
    profil,
  });

  return Response.json(updated);
}

export async function DELETE(
  request: Request,
  { params }: DosenDetailRouteProps
) {
  await requireAdmin();
  const { slug } = await params;

  const dosen = await db.orm.public.Dosen.all();
  const item = dosen.find((d) => d.slug === slug);

  if (!item) {
    return Response.json(
      { message: "Dosen tidak ditemukan" },
      { status: 404 }
    );
  }

  await db.orm.public.Dosen
    .where({ id: item.id })
    .delete();

  return Response.json({
    message: "Dosen berhasil dihapus",
  });
}
