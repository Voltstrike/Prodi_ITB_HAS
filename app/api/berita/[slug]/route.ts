import { db } from "@/prisma/db";

interface BeritaDetailRouteProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function GET(
  request: Request,
  { params }: BeritaDetailRouteProps
) {
  const { slug } = await params;

  const berita = await db.orm.public.Berita.all();
  const item = berita.find((b) => b.slug === slug);

  if (!item) {
    return Response.json(
      { message: "Berita tidak ditemukan" },
      { status: 404 }
    );
  }

  return Response.json(item);
}

export async function PUT(
  request: Request,
  { params }: BeritaDetailRouteProps
) {
  const { slug } = await params;
  const body = await request.json();

  const {
    title,
    date,
    description,
    image,
    content,
  } = body;

  if (
    !title ||
    !date ||
    !description ||
    !image ||
    !content
  ) {
    return Response.json(
      { message: "Semua field wajib diisi" },
      { status: 400 }
    );
  }

  const berita = await db.orm.public.Berita.all();
  const item = berita.find((b) => b.slug === slug);

  if (!item) {
    return Response.json(
      { message: "Berita tidak ditemukan" },
      { status: 404 }
    );
  }

  const updated = await db.orm.public.Berita
    .where({ id: item.id })
    .update({
      title,
      date,
      description,
      image,
      content,
    });

  return Response.json(updated);
}

export async function DELETE(
  request: Request,
  { params }: BeritaDetailRouteProps
) {
  const { slug } = await params;

  const berita = await db.orm.public.Berita.all();
  const item = berita.find((b) => b.slug === slug);

  if (!item) {
    return Response.json(
      { message: "Berita tidak ditemukan" },
      { status: 404 }
    );
  }

  await db.orm.public.Berita
    .where({ id: item.id })
    .delete();

  return Response.json({
    message: "Berita berhasil dihapus",
  });
}