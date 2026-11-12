export const MEDIA_LIBRARY_PAGE_SIZE = 24;
export const MEDIA_LIBRARY_MAX_QUERY_LENGTH = 160;

export const MEDIA_LIBRARY_TYPES = [
    { value: "GAMBAR", label: "Gambar" },
    { value: "DOKUMEN", label: "Dokumen PDF" },
] as const;

export type MediaLibraryType =
    (typeof MEDIA_LIBRARY_TYPES)[number]["value"];

export type MediaLibraryFilters = {
    q: string;
    jenis: MediaLibraryType | "";
    page: number;
};

export type MediaLibraryFilterResult =
    | { ok: true; filters: MediaLibraryFilters }
    | { ok: false; message: string };

export function parseMediaLibraryFilters(
    params: URLSearchParams,
): MediaLibraryFilterResult {
    for (const key of ["q", "jenis", "page"]) {
        if (params.getAll(key).length > 1) {
            return {
                ok: false,
                message: "Parameter pustaka media tidak boleh berulang.",
            };
        }
    }

    const rawQuery = params.get("q") ?? "";

    if (
        rawQuery.length > MEDIA_LIBRARY_MAX_QUERY_LENGTH ||
        /\p{Cc}/u.test(rawQuery)
    ) {
        return {
            ok: false,
            message: "Pencarian media tidak valid atau melebihi 160 karakter.",
        };
    }

    const q = rawQuery.trim().replace(/\s+/gu, " ");
    const rawType = params.get("jenis") ?? "";
    const type = MEDIA_LIBRARY_TYPES.find(
        (item) => item.value === rawType,
    );

    if (rawType !== "" && !type) {
        return { ok: false, message: "Jenis media tidak valid." };
    }

    const rawPage = params.get("page") ?? "1";

    if (rawPage.length > 16 || !/^[1-9]\d*$/u.test(rawPage)) {
        return {
            ok: false,
            message: "Nomor halaman media tidak valid.",
        };
    }

    const page = Number(rawPage);

    if (!Number.isSafeInteger(page)) {
        return {
            ok: false,
            message: "Nomor halaman media terlalu besar.",
        };
    }

    return {
        ok: true,
        filters: { q, jenis: type?.value ?? "", page },
    };
}

function queryString(
    filters: MediaLibraryFilters,
    page: number,
): string {
    if (!Number.isSafeInteger(page) || page < 1) {
        throw new RangeError("Nomor halaman media tidak valid.");
    }

    const params = new URLSearchParams();

    if (filters.q) params.set("q", filters.q);
    if (filters.jenis) params.set("jenis", filters.jenis);
    if (page > 1) params.set("page", String(page));

    const search = params.toString();
    return search ? `?${search}` : "";
}

export function mediaLibraryHref(
    filters: MediaLibraryFilters,
    page = filters.page,
): string {
    return `/admin/pustaka-media${queryString(filters, page)}`;
}

export function mediaLibraryApiHref(
    filters: MediaLibraryFilters,
    page = filters.page,
): string {
    return `/api/admin/pustaka-media${queryString(filters, page)}`;
}
