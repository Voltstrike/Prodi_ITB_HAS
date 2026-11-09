import { db } from "@/prisma/db";
import type { PublicationFilters, PublicationScope } from "./filters";

export type PublicationRow = {
    id: number;
    judul: string;
    slug: string;
    jenis: string;
    penulis: string;
    tahun: number;
    sumber: string;
    ringkasan: string | null;
    tautanPublikasi: string;
    doi: string | null;
    ditampilkan: boolean;
    createdAt: string;
    updatedAt: string;
};

export type PublicationPage = {
    publications: PublicationRow[];
    total: number;
    page: number;
    totalPages: number;
    pageSize: number;
};

const fields = [
    "id", "judul", "slug", "jenis", "penulis", "tahun", "sumber",
    "ringkasan", "tautanPublikasi", "doi", "ditampilkan",
    "createdAt", "updatedAt",
] as const;

export function toPublicationDto(row: PublicationRow): PublicationRow {
    return {
        id: row.id,
        judul: row.judul,
        slug: row.slug,
        jenis: row.jenis,
        penulis: row.penulis,
        tahun: row.tahun,
        sumber: row.sumber,
        ringkasan: row.ringkasan,
        tautanPublikasi: row.tautanPublikasi,
        doi: row.doi,
        ditampilkan: row.ditampilkan,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
}

async function readPublicationPage(
    filters: PublicationFilters,
    scope: PublicationScope,
): Promise<PublicationPage> {
    const status = scope === "public" ? "TAMPIL" : filters.status;
    const pageSize = scope === "public" ? 9 : 25;
    const tahun = filters.tahun ?? 0;
    const pattern = `%${filters.q.replace(/[\\%_]/g, "\\$&")}%`;

    const plan = db.raw.sql`
        WITH filtered AS MATERIALIZED (
            SELECT pub.id, pub.tahun
            FROM public."publikasiIlmiah" AS pub
            WHERE (
                ${status}::text = 'SEMUA'
                OR (${status}::text = 'TAMPIL' AND pub.ditampilkan = true)
                OR (${status}::text = 'TERSEMBUNYI' AND pub.ditampilkan = false)
            )
            AND (
                ${filters.jenis}::text = ''
                OR pub.jenis = ${filters.jenis}::text
            )
            AND (${tahun}::integer = 0 OR pub.tahun = ${tahun}::integer)
            AND (
                ${filters.q}::text = ''
                OR pub.judul ILIKE ${pattern}::text ESCAPE chr(92)
                OR pub.penulis ILIKE ${pattern}::text ESCAPE chr(92)
                OR pub.sumber ILIKE ${pattern}::text ESCAPE chr(92)
                OR COALESCE(pub.doi, '') ILIKE ${pattern}::text ESCAPE chr(92)
            )
        ),
        totals AS (
            SELECT count(*)::integer AS total FROM filtered
        ),
        bounds AS (
            SELECT
                total,
                GREATEST(
                    1,
                    ((total::bigint + ${pageSize - 1}) / ${pageSize})::integer
                ) AS "totalPages"
            FROM totals
        ),
        chosen AS (
            SELECT
                total,
                "totalPages",
                LEAST(
                    ${String(filters.page)}::numeric,
                    "totalPages"::numeric
                )::integer AS page
            FROM bounds
        )
        SELECT
            COALESCE(item.id, 0)::integer AS id,
            chosen.total,
            chosen.page,
            chosen."totalPages"
        FROM chosen
        LEFT JOIN LATERAL (
            SELECT id, tahun
            FROM filtered
            ORDER BY tahun DESC, id DESC
            LIMIT ${pageSize}
            OFFSET ((chosen.page - 1)::bigint * ${pageSize})
        ) AS item ON true
        ORDER BY item.tahun DESC, item.id DESC
    `.returnsRow({
        id: "pg/int4@1",
        total: "pg/int4@1",
        page: "pg/int4@1",
        totalPages: "pg/int4@1",
    }).build();

    const records = await db.runtime().query(plan);
    const metadata = records[0];

    if (!metadata) {
        throw new Error("Metadata pagination publikasi tidak tersedia.");
    }

    const result: PublicationPage = {
        publications: [],
        total: metadata.total,
        page: metadata.page,
        totalPages: metadata.totalPages,
        pageSize,
    };

    const ids = records.map((record) => record.id).filter((id) => id > 0);
    if (ids.length === 0) return result;

    const publications = await db.orm.public.PublikasiIlmiah
        .where((row) => row.id.in(ids))
        .select(...fields)
        .all();

    const byId = new Map(publications.map((row) => [row.id, row]));

    for (const id of ids) {
        const row = byId.get(id);
        if (!row) continue;

        // Periksa ulang status jika admin menyembunyikan karya saat query berjalan.
        if (scope === "public" && row.ditampilkan !== true) continue;

        result.publications.push(toPublicationDto(row));
    }

    return result;
}

export function getPublicationsPage(filters: PublicationFilters) {
    return readPublicationPage(filters, "public");
}

export function getAdminPublicationsPage(filters: PublicationFilters) {
    return readPublicationPage(filters, "admin");
}

export async function getPublicPublicationBySlug(
    slug: string,
): Promise<PublicationRow | null> {
    const row = await db.orm.public.PublikasiIlmiah
        .where({ slug, ditampilkan: true })
        .select(...fields)
        .first();

    return row ? toPublicationDto(row) : null;
}

export async function getAdminPublicationById(
    id: number,
): Promise<PublicationRow | null> {
    const row = await db.orm.public.PublikasiIlmiah
        .where({ id })
        .select(...fields)
        .first();

    return row ? toPublicationDto(row) : null;
}
