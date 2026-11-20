import type { MetadataRoute } from "next";
import { db } from "@/prisma/db";
import { siteOrigin } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const staticPages = ["/", "/profil", "/akademik", "/dosen", "/pendaftaran", "/berita", "/kegiatan-prodi", "/publikasi"];
    const { Berita, Dosen, KegiatanProdi, PublikasiIlmiah } = db.orm.public;
    const [news, lecturers, activities, publications] = await Promise.all([
        Berita.where({ status: "PUBLISHED" }).select("slug", "updatedAt").all(),
        Dosen.select("slug", "updatedAt").all(),
        KegiatanProdi.select("slug", "updatedAt").all(),
        PublikasiIlmiah.where({ ditampilkan: true }).select("slug", "updatedAt").all(),
    ]);
    function details(section: string, rows: { slug: string; updatedAt: string }[]) {
        return rows.map(row => ({
            url: `${siteOrigin}/${section}/${encodeURIComponent(row.slug)}`,
            lastModified: new Date(row.updatedAt),
        }));
    }
    return [
        ...staticPages.map(path => ({ url: siteOrigin + path })),
        ...details("berita", news), ...details("dosen", lecturers),
        ...details("kegiatan-prodi", activities), ...details("publikasi", publications),
    ];
}
