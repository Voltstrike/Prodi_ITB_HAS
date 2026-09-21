import { db } from "@/prisma/db";

export async function GET() {
  const kurikulum = await db.orm.public.Kurikulum.all();

  return Response.json(kurikulum);
}

export async function POST(request: Request) {
  const body = await request.json();

  const {
    kode,
    nama,
    sks,
    semester,
    jenis,
  } = body;

  if (!kode || !nama || !sks || !semester || !jenis) {
    return Response.json(
      { message: "Semua field wajib diisi" },
      { status: 400 }
    );
  }

  const kurikulum = await db.orm.public.Kurikulum.create({
    kode,
    nama,
    sks,
    semester,
    jenis,
  });

  return Response.json(kurikulum, { status: 201 });
}
