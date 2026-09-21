import Image from "next/image";
import { berita } from "@/data/berita";
import { notFound } from "next/navigation";

interface BeritaDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function BeritaDetailPage({
  params,
}: BeritaDetailPageProps) {
  const { slug } = await params;

  const item = berita.find((berita) => berita.slug === slug);

  if (!item) {
    notFound();
  }

  return (
    <main>
      {/* Header */}
      <section>
        <p>{item.date}</p>
        <h1>{item.title}</h1>
        <p>{item.description}</p>
      </section>

      {/* Image */}
      <section>
        <Image
          src={item.image}
          alt={item.title}
          width={800}
          height={500}
        />
      </section>

      {/* Content */}
      <article>
        <p>{item.content}</p>
      </article>
    </main>
  );
}