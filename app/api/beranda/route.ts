import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { createAuditLog } from "@/lib/audit/log";
import {
    FOTO_BERANDA_FIELDS,
    type FotoBerandaValues,
} from "@/lib/beranda/constants";
import { toBerandaDto } from "@/lib/http/dto";
import { readJsonObjectBody } from "@/lib/http/json";
import { requireSameOriginRequest } from "@/lib/http/origin";
import { validateTextFieldTypes } from "@/lib/http/text-fields";
import { parseImageSource } from "@/lib/images/source";
import { db } from "@/prisma/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BERANDA_BODY_BYTES = 32 * 1024;
const MAX_FOTO_LENGTH = 2048;

function jsonResponse(body: unknown, status = 200) {
    return Response.json(body, {
        status,
        headers: {
            "Cache-Control": "no-store",
        },
    });
}

export async function GET() {
    try {
        const beranda = await db.orm.public.Beranda
            .where({ singletonKey: 1 })
            .first();

        return jsonResponse(toBerandaDto(beranda));
    } catch (error) {
        console.error(
            "GET BERANDA ERROR:",
            error instanceof Error ? error.name : "UnknownError",
        );

        return jsonResponse(
            { message: "Gagal memuat pengaturan beranda." },
            500,
        );
    }
}

export async function PUT(request: Request) {
    const originError = requireSameOriginRequest(request);

    if (originError) {
        return originError;
    }

    const admin = await requireAdminApi();

    if (!admin) {
        return jsonResponse(
            { message: "Silakan login kembali." },
            401,
        );
    }

    try {
        const bodyResult = await readJsonObjectBody(
            request,
            MAX_BERANDA_BODY_BYTES,
        );

        if (!bodyResult.ok) {
            return bodyResult.response;
        }

        const body = bodyResult.body;

        const textTypeError = validateTextFieldTypes(
            body,
            FOTO_BERANDA_FIELDS.map((field) => field.name),
        );

        if (textTypeError) {
            return jsonResponse({ message: textTypeError }, 400);
        }

        const photos: Partial<FotoBerandaValues> = {};

        for (const { name, label } of FOTO_BERANDA_FIELDS) {
            if (!Object.hasOwn(body, name)) {
                continue;
            }

            const foto = String(body[name] ?? "").trim();

            if (foto.length > MAX_FOTO_LENGTH) {
                return jsonResponse(
                    {
                        message:
                            `${label} maksimal ${MAX_FOTO_LENGTH} karakter.`,
                    },
                    400,
                );
            }

            if (foto && parseImageSource(foto) === null) {
                return jsonResponse(
                    {
                        message:
                            `${label} harus berupa path lokal atau URL HTTP/HTTPS yang valid.`,
                    },
                    400,
                );
            }

            photos[name] = foto || null;
        }

        if (Object.keys(photos).length === 0) {
            return jsonResponse(
                { message: "Data foto beranda tidak valid." },
                400,
            );
        }

        const saved = await db.transaction(async (tx) => {
            const existing = await tx.orm.public.Beranda
                .where({ singletonKey: 1 })
                .first();

            const beranda = existing
                ? await tx.orm.public.Beranda
                    .where({ id: existing.id })
                    .update(photos)
                : await tx.orm.public.Beranda.create({
                    singletonKey: 1,
                    ...photos,
                });

            if (!beranda) {
                throw new Error(
                    "Konfigurasi beranda gagal disimpan.",
                );
            }

            await createAuditLog({
                userId: admin.id,
                action: existing ? "UPDATE" : "CREATE",
                entity: "Beranda",
                entityId: beranda.id,
                details: "Menyimpan pengaturan foto beranda",
                dbClient: tx,
            });

            return beranda;
        });

        return jsonResponse(toBerandaDto(saved));
    } catch (error) {
        console.error(
            "SAVE BERANDA ERROR:",
            error instanceof Error ? error.name : "UnknownError",
        );

        return jsonResponse(
            {
                message:
                    "Gagal menyimpan pengaturan beranda. Silakan coba kembali.",
            },
            500,
        );
    }
}
