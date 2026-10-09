import { requireSameOriginRequest } from "@/lib/http/origin";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { readJsonObjectBody } from "@/lib/http/json";
import { db } from "@/prisma/db";

const MAX_CHECK_BODY_BYTES = 128 * 1024;
const MAX_NIDN_ITEMS = 1_000;
const MAX_NIDN_LENGTH = 32;

export async function POST(request: Request) {
    const originError = requireSameOriginRequest(request);
    if (originError) {
        return originError;
    }

    const user = await requireAdminApi();

    if (!user) {
        return Response.json(
            { message: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        const bodyResult = await readJsonObjectBody(
            request,
            MAX_CHECK_BODY_BYTES
        );

        if (!bodyResult.ok) {
            return bodyResult.response;
        }

        const nidnList = bodyResult.body.nidnList;

        if (!Array.isArray(nidnList)) {
            return Response.json(
                { message: "nidnList harus berupa array" },
                { status: 400 }
            );
        }

        if (nidnList.length > MAX_NIDN_ITEMS) {
            return Response.json(
                {
                    message:
                        `Pemeriksaan maksimal ${MAX_NIDN_ITEMS} NIDN sekali proses`,
                },
                { status: 400 }
            );
        }

        const normalizedNidnList = nidnList
            .map((nidn: unknown) => String(nidn ?? "").trim())
            .filter(Boolean);

        if (
            normalizedNidnList.some(
                (nidn) => nidn.length > MAX_NIDN_LENGTH
            )
        ) {
            return Response.json(
                { message: "NIDN melebihi batas panjang" },
                { status: 400 }
            );
        }

        const uniqueNidnList = [...new Set(normalizedNidnList)];

        if (uniqueNidnList.length === 0) {
            return Response.json({ existingNidn: [] });
        }

        const dosen = await db.orm.public.Dosen
            .where((d) => d.nidn.in(uniqueNidnList))
            .select("nidn")
            .all();

        const existingNidn = dosen.map((item) => item.nidn);

        return Response.json({
            existingNidn,
        });
    } catch {
        return Response.json(
            { message: "Gagal memeriksa NIDN" },
            { status: 500 }
        );
    }
}
