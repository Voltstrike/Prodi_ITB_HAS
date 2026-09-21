import { db } from "@/prisma/db";

export async function GET() {
  const berita = await db.orm.public.Berita.all();

  return Response.json(berita);
}

export async function POST(request: Request) {
  const body = await request.json();

  const {
    title,
    date,
    description,
    image,
    slug,
    content,
  } = body;

  if (
    !title ||
    !date ||
    !description ||
    !image ||
    !slug ||
    !content
  ) {
    return Response.json(
      { message: "Semua field wajib diisi" },
      { status: 400 }
    );
  }

  const berita = await db.orm.public.Berita.create({
    title,
    date,
    description,
    image,
    slug,
    content,
  });

  return Response.json(berita, { status: 201 });
}