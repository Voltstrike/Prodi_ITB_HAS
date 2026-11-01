import {
    DOKUMEN_MIME_TYPE,
    isDokumenFileName,
} from "@/lib/dokumen/constants";
import { readDokumen } from "@/lib/dokumen/storage";
import { db } from "@/prisma/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteProps = {
    params: Promise<{ filename: string }>;
};

function errorResponse(
    message: string,
    status: number,
    headersOnly: boolean,
) {
    return new Response(
        headersOnly ? null : JSON.stringify({ message }),
        {
            status,
            headers: {
                "Cache-Control": "no-store",
                "Content-Type": "application/json; charset=utf-8",
            },
        },
    );
}

async function serveDokumen(
    request: Request,
    { params }: RouteProps,
    headersOnly: boolean,
) {
    try {
        const { filename } = await params;

        if (!isDokumenFileName(filename)) {
            return errorResponse(
                "Dokumen tidak ditemukan.",
                404,
                headersOnly,
            );
        }

        const dokumen = await db.orm.public.DokumenKurikulum
            .where({ filename })
            .first();

        if (!dokumen) {
            return errorResponse(
                "Dokumen tidak ditemukan.",
                404,
                headersOnly,
            );
        }

        const file = await readDokumen(filename, headersOnly);

        if (!file) {
            return errorResponse(
                "Dokumen tidak ditemukan.",
                404,
                headersOnly,
            );
        }

        if (file.size !== dokumen.ukuran) {
            throw new Error(
                "Ukuran dokumen tidak sesuai catatan database.",
            );
        }

        const download =
            new URL(request.url).searchParams.get("download") === "1";

        const disposition = download ? "attachment" : "inline";

        const encodedName = encodeURIComponent(
            dokumen.namaAsli,
        ).replace(
            /['()*]/g,
            (character) =>
                `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
        );

        return new Response(
            file.data === null ? null : new Uint8Array(file.data),
            {
                status: 200,
                headers: {
                    "Content-Type": DOKUMEN_MIME_TYPE,
                    "Content-Length": String(file.size),
                    "Content-Disposition":
                        `${disposition}; filename="${filename}"; ` +
                        `filename*=UTF-8''${encodedName}`,
                    "Cache-Control": "no-store",
                    "X-Content-Type-Options": "nosniff",
                    "X-Frame-Options": "SAMEORIGIN",
                },
            },
        );
    } catch (error) {
        console.error(
            "READ DOKUMEN ERROR:",
            error instanceof Error ? error.name : "UnknownError",
        );

        return errorResponse(
            "Dokumen gagal dibuka.",
            500,
            headersOnly,
        );
    }
}

export async function GET(
    request: Request,
    props: RouteProps,
) {
    return serveDokumen(request, props, false);
}

export async function HEAD(
    request: Request,
    props: RouteProps,
) {
    return serveDokumen(request, props, true);
}

