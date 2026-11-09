export const JENIS_PUBLIKASI = ["TESIS", "ARTIKEL"] as const;
export type JenisPublikasi = (typeof JENIS_PUBLIKASI)[number];

export type PublikasiInput = {
    judul: string;
    jenis: JenisPublikasi;
    penulis: string;
    tahun: number;
    sumber: string;
    ringkasan: string | null;
    tautanPublikasi: string;
    doi: string | null;
    ditampilkan: boolean;
};

type ValidationResult =
    | { ok: true; data: PublikasiInput }
    | { ok: false; message: string };

const textFields = [
    "judul", "jenis", "penulis", "sumber",
    "ringkasan", "tautanPublikasi", "doi",
] as const;

const allowedFields = new Set<string>([
    ...textFields, "tahun", "ditampilkan",
]);

function invalidCharacters(value: string, multiline = false): boolean {
    for (const character of value) {
        const code = character.codePointAt(0) ?? 0;

        if (
            (code < 32 && !(multiline && [9, 10, 13].includes(code))) ||
            (code >= 127 && code <= 159) ||
            (code >= 0xd800 && code <= 0xdfff)
        ) return true;
    }

    return false;
}

export function publicationMaxYear(now: Date = new Date()): number {
    return Number(new Intl.DateTimeFormat("en", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
    }).format(now)) + 1;
}

export function publicationAuthors(value: string): string[] {
    return value.split(/\r\n?|\n/)
        .map((name) => name.trim())
        .filter(Boolean);
}

export function normalizePublicationDoi(input: unknown): string | null {
    if (typeof input !== "string") return null;

    let value = input.trim().replace(/^doi:\s*/i, "");
    if (!value || invalidCharacters(value)) return null;

    if (/^https?:\/\//i.test(value)) {
        try {
            const url = new URL(value);

            if (
                !["doi.org", "dx.doi.org"].includes(url.hostname) ||
                url.username || url.password || url.port ||
                url.search || url.hash
            ) return null;

            value = decodeURIComponent(url.pathname.slice(1));
        } catch {
            return null;
        }
    }

    if (
        !/^10\.\d+(?:\.\d+)*\/\S+$/.test(value) ||
        invalidCharacters(value) ||
        new TextEncoder().encode(value).length > 1024
    ) return null;

    return value.replace(/[A-Z]/g, (letter) => letter.toLowerCase());
}

export function publicationDoiUrl(value: string | null): string | null {
    const doi = normalizePublicationDoi(value);

    return doi
        ? `https://doi.org/${doi.split("/").map((part) => encodeURIComponent(part)).join("/")}`
        : null;
}

export function validatePublikasiInput(
    body: Record<string, unknown>,
    maxYear: number = publicationMaxYear(),
): ValidationResult {
    if (Object.keys(body).some((field) => !allowedFields.has(field))) {
        return { ok: false, message: "Field publikasi tidak valid." };
    }

    for (const field of textFields) {
        const value = body[field];

        if (value !== undefined && value !== null && typeof value !== "string") {
            return { ok: false, message: `Field ${field} harus berupa teks.` };
        }
    }

    if (body.ditampilkan !== undefined && typeof body.ditampilkan !== "boolean") {
        return { ok: false, message: "Status tampil harus berupa boolean." };
    }

    const judulRaw = String(body.judul ?? "");
    const penulisRaw = String(body.penulis ?? "");
    const sumberRaw = String(body.sumber ?? "");
    const ringkasanRaw = String(body.ringkasan ?? "");

    if (
        [judulRaw, penulisRaw, sumberRaw, ringkasanRaw]
            .some((value) => invalidCharacters(value, true))
    ) {
        return {
            ok: false,
            message: "Teks publikasi mengandung karakter yang tidak valid.",
        };
    }

    const judul = judulRaw.trim().replace(/\s+/g, " ");
    const jenis = String(body.jenis ?? "").trim();
    const sumber = sumberRaw.trim().replace(/\s+/g, " ");
    const ringkasan = ringkasanRaw.replace(/\r\n?/g, "\n").trim() || null;
    const tautanRaw = String(body.tautanPublikasi ?? "").trim();

    if (!judul || !penulisRaw.trim() || !sumber || !tautanRaw) {
        return {
            ok: false,
            message: "Judul, penulis, sumber, dan tautan publikasi wajib diisi.",
        };
    }

    if (jenis !== "TESIS" && jenis !== "ARTIKEL") {
        return {
            ok: false,
            message: "Jenis publikasi harus TESIS atau ARTIKEL.",
        };
    }

    if (
        judul.length > 300 ||
        sumber.length > 300 ||
        (ringkasan?.length ?? 0) > 10000
    ) {
        return {
            ok: false,
            message: "Judul/sumber maksimal 300 karakter dan ringkasan maksimal 10.000 karakter.",
        };
    }

    if (penulisRaw.length > 4200) {
        return { ok: false, message: "Daftar penulis terlalu panjang." };
    }

    const authors = publicationAuthors(penulisRaw)
        .map((name) => name.replace(/\s+/g, " "));

    if (
        authors.length < 1 ||
        authors.length > 20 ||
        authors.some((name) => name.length > 200)
    ) {
        return {
            ok: false,
            message: "Isi 1–20 nama penulis, satu nama per baris, maksimal 200 karakter per nama.",
        };
    }

    const rawYear =
        typeof body.tahun === "number" || typeof body.tahun === "string"
            ? String(body.tahun).trim()
            : "";

    const tahun = Number(rawYear);

    if (!/^\d{4}$/.test(rawYear) || tahun < 1900 || tahun > maxYear) {
        return {
            ok: false,
            message: `Tahun terbit harus antara 1900 dan ${maxYear}.`,
        };
    }

    let tautanPublikasi: string;

    try {
        if (tautanRaw.length > 2048 || invalidCharacters(tautanRaw)) {
            throw new Error();
        }

        const url = new URL(tautanRaw);

        if (
            !["http:", "https:"].includes(url.protocol) ||
            !url.hostname ||
            url.username ||
            url.password ||
            url.href.length > 2048
        ) throw new Error();

        tautanPublikasi = url.href;
    } catch {
        return {
            ok: false,
            message: "Gunakan tautan publikasi HTTP/HTTPS yang valid tanpa username atau password, maksimal 2.048 karakter.",
        };
    }

    const doiRaw = String(body.doi ?? "").trim();
    const doi = normalizePublicationDoi(doiRaw);

    if (doiRaw && !doi) {
        return {
            ok: false,
            message: "DOI tidak valid. Gunakan 10.…/… atau tautan doi.org tanpa parameter/fragmen.",
        };
    }

    return {
        ok: true,
        data: {
            judul,
            jenis,
            penulis: authors.join("\n"),
            tahun,
            sumber,
            ringkasan,
            tautanPublikasi,
            doi,
            ditampilkan: body.ditampilkan === true,
        },
    };
}
