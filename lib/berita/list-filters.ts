export const NEWS_PAGE_SIZE = 9;
export const NEWS_MAX_QUERY_LENGTH = 160;

export type NewsListFilters = {
    q: string;
    page: number;
};

export type NewsListFilterResult =
    | { ok: true; filters: NewsListFilters }
    | { ok: false; message: string };

export function parseNewsListFilters(
    params: URLSearchParams,
): NewsListFilterResult {
    for (const key of ["q", "page"]) {
        if (params.getAll(key).length > 1) {
            return {
                ok: false,
                message: "Parameter pencarian tidak boleh berulang.",
            };
        }
    }

    const rawQuery = params.get("q") ?? "";

    if (rawQuery.length > NEWS_MAX_QUERY_LENGTH) {
        return {
            ok: false,
            message: "Pencarian maksimal 160 karakter.",
        };
    }

    if (/\p{Cc}/u.test(rawQuery)) {
        return {
            ok: false,
            message: "Pencarian memuat karakter yang tidak valid.",
        };
    }

    const q = rawQuery.trim().replace(/\s+/gu, " ");

    if (q !== "" && [...q].length < 2) {
        return {
            ok: false,
            message: "Masukkan minimal 2 karakter pencarian.",
        };
    }

    const rawPage = params.get("page") ?? "1";

    if (rawPage.length > 16 || !/^[1-9]\d*$/u.test(rawPage)) {
        return {
            ok: false,
            message: "Nomor halaman tidak valid.",
        };
    }

    const page = Number(rawPage);

    if (!Number.isSafeInteger(page)) {
        return {
            ok: false,
            message: "Nomor halaman terlalu besar.",
        };
    }

    return { ok: true, filters: { q, page } };
}

export function escapeNewsSearchLike(value: string): string {
    return value.replace(/[\\%_]/g, "\\$&");
}

export function newsPageHref(
    filters: NewsListFilters,
    page = filters.page,
): string {
    if (!Number.isSafeInteger(page) || page < 1) {
        throw new RangeError("Nomor halaman tautan tidak valid.");
    }

    const params = new URLSearchParams();

    if (filters.q) params.set("q", filters.q);
    if (page > 1) params.set("page", String(page));

    const search = params.toString();
    return `/berita${search ? `?${search}` : ""}`;
}
