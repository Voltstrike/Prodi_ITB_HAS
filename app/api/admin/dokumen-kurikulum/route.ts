import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { createAuditLog } from "@/lib/audit/log";
import { DokumenUploadError } from "@/lib/dokumen/constants";
import { readDokumenUpload } from "@/lib/dokumen/multipart";
import { validateUploadedPdf } from "@/lib/dokumen/pdf";
import { saveDokumen } from "@/lib/dokumen/storage";
import { toDokumenKurikulumDto } from "@/lib/http/dto";
import { requireSameOriginRequest } from "@/lib/http/origin";
import { db } from "@/prisma/db";

export const runtime = "nodejs";

const activeUploads = new Set<number>();
const NO_STORE_HEADERS = {
    "Cache-Control": "no-store",
};

export async function POST(request: Request) {
    const originError = requireSameOriginRequest(request);

    if (originError) {
        return originError;
    }

    const admin = await requireAdminApi();

    if (!admin) {
        return Response.json(
            { message: "Silakan login kembali." },
            {
                status: 401,
                headers: NO_STORE_HEADERS,
            },
        );
    }

    if (activeUploads.has(admin.id) || activeUploads.size >= 2) {
        return Response.json(
            {
                message:
                    "Unggahan sedang diproses. Coba lagi sebentar.",
            },
            {
                status: 429,
                headers: {
                    ...NO_STORE_HEADERS,
                    "Retry-After": "2",
                },
            },
        );
    }

    activeUploads.add(admin.id);

    try {
        const { judul, file } = await readDokumenUpload(request);
        const pdf = await validateUploadedPdf(file);
        const filename = await saveDokumen(pdf.data);

        const created = await db.transaction(async (tx) => {
            const dokumen =
                await tx.orm.public.DokumenKurikulum.create({
                    judul,
                    filename,
                    namaAsli: pdf.namaAsli,
                    ukuran: pdf.data.length,
                });

            await createAuditLog({
                userId: admin.id,
                action: "CREATE",
                entity: "DokumenKurikulum",
                entityId: dokumen.id,
                details:
                    `Mengunggah dokumen kurikulum: ${dokumen.judul}`,
                dbClient: tx,
            });

            return dokumen;
        });

        return Response.json(
            toDokumenKurikulumDto(created),
            {
                status: 201,
                headers: NO_STORE_HEADERS,
            },
        );
    } catch (error) {
        if (error instanceof DokumenUploadError) {
            return Response.json(
                { message: error.message },
                {
                    status: error.status,
                    headers: NO_STORE_HEADERS,
                },
            );
        }

        console.error(
            "DOKUMEN UPLOAD ERROR:",
            error instanceof Error ? error.name : "UnknownError",
        );

        return Response.json(
            {
                message:
                    "Dokumen gagal disimpan. Silakan coba kembali.",
            },
            {
                status: 500,
                headers: NO_STORE_HEADERS,
            },
        );
    } finally {
        activeUploads.delete(admin.id);
    }
}
