import { parsePositiveInt32 } from "@/lib/http/positive-int32";
import { validateTextFieldTypes } from "@/lib/http/text-fields";

export const JENIS_KEGIATAN = ["PENELITIAN", "PENGABDIAN"] as const;

export type JenisKegiatan = (typeof JENIS_KEGIATAN)[number];

export type KegiatanProdiInput = {
    judul: string;
    jenis: JenisKegiatan;
    tahun: number;
    dosenId: number;
    ringkasan: string;
    uraian: string;
    foto: string | null;
    tautanHasil: string | null;
};

export type KegiatanValidationResult =
    | { ok: true; data: KegiatanProdiInput }
    | { ok: false; message: string };

const MAX_JUDUL_LENGTH = 300;
const MAX_RINGKASAN_LENGTH = 2000;
const MAX_URAIAN_LENGTH = 20000;
const MAX_FOTO_LENGTH = 2048;
const MAX_TAUTAN_LENGTH = 2048;

export function validateKegiatanProdiInput(
    body: Record<string, unknown>
): KegiatanValidationResult {
    const textTypeError = validateTextFieldTypes(body, [
        "judul",
        "jenis",
        "ringkasan",
        "uraian",
        "foto",
        "tautanHasil",
    ]);

    if (textTypeError) {
        return { ok: false, message: textTypeError };
    }

    const judul = String(body.judul ?? "").trim();
    const jenis = String(body.jenis ?? "").trim();
    const ringkasan = String(body.ringkasan ?? "").trim();
    const uraian = String(body.uraian ?? "").trim();
    const foto = String(body.foto ?? "").trim() || null;
    const tautanHasil = String(body.tautanHasil ?? "").trim() || null;

    if (!judul || !jenis || !ringkasan || !uraian) {
        return {
            ok: false,
            message: "Judul, jenis, ringkasan, dan uraian wajib diisi",
        };
    }

    if (judul.length > MAX_JUDUL_LENGTH) {
        return { ok: false, message: "Judul terlalu panjang" };
    }

    if (ringkasan.length > MAX_RINGKASAN_LENGTH) {
        return { ok: false, message: "Ringkasan terlalu panjang" };
    }

    if (uraian.length > MAX_URAIAN_LENGTH) {
        return { ok: false, message: "Uraian terlalu panjang" };
    }

    if (foto && foto.length > MAX_FOTO_LENGTH) {
        return { ok: false, message: "Alamat foto terlalu panjang" };
    }

    if (tautanHasil && tautanHasil.length > MAX_TAUTAN_LENGTH) {
        return { ok: false, message: "Tautan hasil terlalu panjang" };
    }

    if (jenis !== "PENELITIAN" && jenis !== "PENGABDIAN") {
        return {
            ok: false,
            message: "Jenis harus PENELITIAN atau PENGABDIAN",
        };
    }

    const tahun = parsePositiveInt32(body.tahun);
    const currentYear = new Date().getFullYear();

    if (tahun === null || tahun < 1900 || tahun > currentYear + 1) {
        return {
            ok: false,
            message: `Tahun harus antara 1900 dan ${currentYear + 1}`,
        };
    }

    const dosenId = parsePositiveInt32(body.dosenId);

    if (dosenId === null) {
        return {
            ok: false,
            message: "ID dosen harus berupa bilangan bulat positif",
        };
    }

    if (tautanHasil) {
        try {
            const url = new URL(tautanHasil);

            if (url.protocol !== "http:" && url.protocol !== "https:") {
                return {
                    ok: false,
                    message: "Tautan hasil harus menggunakan HTTP atau HTTPS",
                };
            }

            if (url.username || url.password) {
                return {
                    ok: false,
                    message: "Tautan hasil tidak boleh memuat username atau password",
                };
            }
        } catch {
            return {
                ok: false,
                message: "Format tautan hasil tidak valid",
            };
        }
    }

    return {
        ok: true,
        data: {
            judul,
            jenis,
            tahun,
            dosenId,
            ringkasan,
            uraian,
            foto,
            tautanHasil,
        },
    };
}
