import type { Metadata } from "next";

export const siteOrigin = "https://mm.itbhas.ac.id";

export function detailMetadata(section: string, slug: string, title: string, summary: string): Metadata {
    const words = summary.trim().replace(/\s+/gu, " ");
    const chars = Array.from(words);
    const description = chars.length <= 180 ? words : chars.slice(0, 177).join("").replace(/\s+\S*$/, "") + "…";
    return {
        title: `${title} | Magister Manajemen ITB HAS`,
        description,
        alternates: { canonical: `/${section}/${encodeURIComponent(slug)}` },
    };
}

export function listingMetadata(path: string, title: string, description: string,
    params: Record<string, string | string[] | undefined>): Metadata {
    const { page, ...rest } = params;
    const filtered = Object.entries(rest).some(([key, value]) =>
        !key.startsWith("utm_") && value !== undefined && value !== "");
    const paginated = path !== "/akademik";
    const validPage = typeof page === "string" && /^[1-9]\d*$/.test(page) && Number.isSafeInteger(Number(page));
    if (filtered || (paginated && page !== undefined && !validPage)) {
        return { title, description, robots: { index: false, follow: true } };
    }
    const numbered = paginated && validPage && page !== "1";
    return {
        title: numbered ? `${title} · Halaman ${page}` : title,
        description,
        alternates: { canonical: numbered ? `${path}?page=${page}` : path },
    };
}
