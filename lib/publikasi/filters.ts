import { publicationMaxYear, type JenisPublikasi } from "./validation";

export type PublicationScope = "public" | "admin";
export type PublicationStatus = "SEMUA" | "TAMPIL" | "TERSEMBUNYI";

export type PublicationFilters = {
    q: string;
    jenis: JenisPublikasi | "";
    tahun: number | null;
    page: number;
    status: PublicationStatus;
};

type FilterResult =
    | { ok: true; filters: PublicationFilters }
    | { ok: false; message: string };

export function parsePublicationFilters(
    params: URLSearchParams,
    scope: PublicationScope = "public",
    maxYear: number = publicationMaxYear(),
): FilterResult {
    const fields = scope === "admin"
        ? ["q", "jenis", "tahun", "page", "status"]
        : ["q", "jenis", "tahun", "page"];

    if (fields.some((field) => params.getAll(field).length > 1)) {
        return { ok: false, message: "Parameter filter tidak boleh berulang." };
    }

    const q = (params.get("q") ?? "").trim();

    if (q.length > 200 || [...q].some((character) => {
        const code = character.codePointAt(0) ?? 0;
        return code < 32 || (code >= 127 && code <= 159);
    })) {
        return {
            ok: false,
            message: "Pencarian maksimal 200 karakter tanpa karakter kontrol.",
        };
    }

    const jenis = (params.get("jenis") ?? "").trim();

    if (jenis !== "" && jenis !== "TESIS" && jenis !== "ARTIKEL") {
        return { ok: false, message: "Jenis publikasi tidak valid." };
    }

    const rawYear = (params.get("tahun") ?? "").trim();
    const tahun = rawYear ? Number(rawYear) : null;

    if (
        tahun !== null &&
        (!/^\d{4}$/.test(rawYear) || tahun < 1900 || tahun > maxYear)
    ) {
        return {
            ok: false,
            message: `Tahun harus antara 1900 dan ${maxYear}.`,
        };
    }

    const rawPage = params.get("page") ?? "1";
    const page = Number(rawPage);

    if (!/^[1-9]\d{0,15}$/.test(rawPage) || !Number.isSafeInteger(page)) {
        return { ok: false, message: "Nomor halaman tidak valid." };
    }

    const status = scope === "admin"
        ? (params.get("status") ?? "SEMUA")
        : "TAMPIL";

    if (status !== "SEMUA" && status !== "TAMPIL" && status !== "TERSEMBUNYI") {
        return { ok: false, message: "Status tampil tidak valid." };
    }

    return { ok: true, filters: { q, jenis, tahun, page, status } };
}

export function publicationHref(
    filters: PublicationFilters,
    page: number = filters.page,
    scope: PublicationScope = "public",
): string {
    if (!Number.isSafeInteger(page) || page < 1) {
        throw new RangeError("Nomor halaman tidak valid.");
    }

    const params = new URLSearchParams();

    if (filters.q) params.set("q", filters.q);
    if (filters.jenis) params.set("jenis", filters.jenis);
    if (filters.tahun !== null) params.set("tahun", String(filters.tahun));

    if (scope === "admin" && filters.status !== "SEMUA") {
        params.set("status", filters.status);
    }

    if (page > 1) params.set("page", String(page));

    const query = params.toString();
    const path = scope === "admin" ? "/admin/publikasi" : "/publikasi";

    return `${path}${query ? `?${query}` : ""}`;
}
