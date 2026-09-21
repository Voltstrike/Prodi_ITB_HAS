import { db } from "@/prisma/db";

export async function GET() {
  const dosen = await db.orm.public.Dosen.all();

  return Response.json(dosen);
}

export async function POST(request: Request) {
  const body = await request.json();

  const {
    nama,
    slug,
    nidn,
    jabatan,
    bidangKeahlian,
    foto,
    email,
    pendidikan,
    profil,
  } = body;

  // Validasi field wajib
  if (
    !nama ||
    !slug ||
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

  const dosen = await db.orm.public.Dosen.create({
  nama,
  slug,
  nidn,
  jabatan,
  bidangKeahlian,
  foto,
  email,
  pendidikan,
  profil,
});

  return Response.json(dosen, { status: 201 });
}
