import { db } from "@/prisma/db";
import {
    NEWS_PAGE_SIZE,
    escapeNewsSearchLike,
    type NewsListFilters,
} from "./list-filters";

export type PublishedNewsItem = {
    id: number;
    title: string;
    date: string;
    description: string;
    image: string;
    thumbnail: string | null;
    slug: string;
};

export type PublishedNewsPage = {
    berita: PublishedNewsItem[];
    total: number;
    page: number;
    totalPages: number;
    pageSize: number;
};

export async function getPublishedNewsPage(
    filters: NewsListFilters,
): Promise<PublishedNewsPage> {
    const size = NEWS_PAGE_SIZE;
    const pattern = `%${escapeNewsSearchLike(filters.q)}%`;

    const plan = db.raw.sql`
        WITH filtered AS MATERIALIZED (
            SELECT b.id, b."createdAt" AS created_at
            FROM public."berita" AS b
            WHERE b.status = 'PUBLISHED'
                AND (
                    ${filters.q}::text = ''
                    OR regexp_replace(
                        concat_ws(' ', b.title, b.description, b.content),
                        '[[:space:]]+', ' ', 'g'
                    ) ILIKE ${pattern}::text ESCAPE chr(92)
                )
        ),
        totals AS (
            SELECT count(*)::integer AS total FROM filtered
        ),
        bounds AS (
            SELECT total,
                GREATEST(
                    1,
                    ((total::bigint + ${size - 1}) / ${size})::integer
                ) AS "totalPages"
            FROM totals
        ),
        chosen AS (
            SELECT total, "totalPages",
                LEAST(
                    ${String(filters.page)}::numeric,
                    "totalPages"::numeric
                )::integer AS page
            FROM bounds
        )
        SELECT
            COALESCE(item.id, 0)::integer AS id,
            COALESCE(item.title, '')::text AS title,
            COALESCE(item.date, '')::text AS date,
            COALESCE(item.description, '')::text AS description,
            COALESCE(item.image, '')::text AS image,
            COALESCE(item.thumbnail, '')::text AS thumbnail,
            COALESCE(item.slug, '')::text AS slug,
            chosen.total, chosen.page, chosen."totalPages"
        FROM chosen
        LEFT JOIN LATERAL (
            SELECT b.id, b.title, b.date, b.description,
                b.image, b.thumbnail, b.slug, f.created_at
            FROM filtered AS f
            JOIN public."berita" AS b ON b.id = f.id
            WHERE b.status = 'PUBLISHED'
            ORDER BY f.created_at DESC, f.id DESC
            LIMIT ${size}
            OFFSET ((chosen.page - 1)::bigint * ${size})
        ) AS item ON true
        ORDER BY item.created_at DESC, item.id DESC
    `.returnsRow({
        id: "pg/int4@1",
        title: "pg/text@1",
        date: "pg/text@1",
        description: "pg/text@1",
        image: "pg/text@1",
        thumbnail: "pg/text@1",
        slug: "pg/text@1",
        total: "pg/int4@1",
        page: "pg/int4@1",
        totalPages: "pg/int4@1",
    }).build();

    const rows = await db.runtime().query(plan);
    const metadata = rows[0];

    if (!metadata) {
        throw new Error("Metadata daftar berita tidak tersedia.");
    }

    return {
        berita: rows.filter((row) => row.id > 0).map((row) => ({
            id: row.id,
            title: row.title,
            date: row.date,
            description: row.description,
            image: row.image,
            thumbnail: row.thumbnail.trim() || null,
            slug: row.slug,
        })),
        total: metadata.total,
        page: metadata.page,
        totalPages: metadata.totalPages,
        pageSize: size,
    };
}
