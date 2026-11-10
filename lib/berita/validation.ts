import { parseImageSource } from "@/lib/images/source";

export const BERITA_STATUSES = ["DRAFT", "PUBLISHED"] as const;
export type BeritaStatus = (typeof BERITA_STATUSES)[number];

export const BERITA_TEXT_LIMITS = {
    title: 300,
    date: 64,
    description: 5000,
    image: 2048,
    thumbnail: 2048,
    content: 100000,
} as const;

type TextField = keyof typeof BERITA_TEXT_LIMITS;

export type BeritaInput = {
    title: string;
    date: string;
    description: string;
    image: string;
    thumbnail: string | null;
    content: string;
    status: BeritaStatus;
};

type ValidationResult =
    | {
        ok: true;
        data: BeritaInput;
        thumbnailProvided: boolean;
    }
    | { ok: false; message: string };

const labels: Record<TextField, string> = {
    title: "Judul",
    date: "Tanggal",
    description: "Deskripsi",
    image: "Alamat gambar",
    thumbnail: "Alamat thumbnail",
    content: "Isi berita",
};

export function isBeritaStatus(value: unknown): value is BeritaStatus {
    return value === "DRAFT" || value === "PUBLISHED";
}

export function validateBeritaInput(
    body: Record<string, unknown>,
    fallbackStatus: BeritaStatus = "DRAFT",
): ValidationResult {
    const allowed = new Set<string>([
        ...Object.keys(BERITA_TEXT_LIMITS),
        "status",
    ]);

    if (Object.keys(body).some((key) => !allowed.has(key))) {
        return { ok: false, message: "Terdapat field berita yang tidak dikenal." };
    }

    const status = body.status === undefined ? fallbackStatus : body.status;

    if (!isBeritaStatus(status)) {
        return { ok: false, message: "Status harus DRAFT atau PUBLISHED." };
    }

    const values = {} as Record<TextField, string>;

    for (const field of Object.keys(BERITA_TEXT_LIMITS) as TextField[]) {
        const raw = body[field];

        if (raw !== undefined && raw !== null && typeof raw !== "string") {
            return {
                ok: false,
                message: `${labels[field]} harus berupa teks.`,
            };
        }

        const value = typeof raw === "string" ? raw.trim() : "";

        if (value.length > BERITA_TEXT_LIMITS[field]) {
            return {
                ok: false,
                message: `${labels[field]} terlalu panjang.`,
            };
        }

        if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/.test(value)) {
            return {
                ok: false,
                message: `${labels[field]} memuat karakter tidak valid.`,
            };
        }

        values[field] = value;
    }

    if (!values.title) {
        return { ok: false, message: "Judul berita wajib diisi." };
    }

    if (
        status === "PUBLISHED" &&
        (!values.date || !values.description || !values.image || !values.content)
    ) {
        return {
            ok: false,
            message:
                "Tanggal, deskripsi, gambar, dan isi berita wajib diisi sebelum diterbitkan.",
        };
    }

    if (values.image && parseImageSource(values.image) === null) {
        return {
            ok: false,
            message: "Gambar harus berupa path lokal atau URL HTTP/HTTPS yang valid.",
        };
    }

    if (values.thumbnail && parseImageSource(values.thumbnail) === null) {
        return {
            ok: false,
            message: "Thumbnail harus berupa path lokal atau URL HTTP/HTTPS yang valid.",
        };
    }

    return {
        ok: true,
        data: {
            title: values.title,
            date: values.date,
            description: values.description,
            image: values.image,
            thumbnail: values.thumbnail || null,
            content: values.content,
            status,
        },
        thumbnailProvided: Object.hasOwn(body, "thumbnail"),
    };
}
