import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { db } from "@/prisma/db";

export async function POST(request: Request) {
    const user = await requireAdminApi();

    if (!user) {
        return Response.json(
            { message: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        const body = await request.json();

        const nidnList = body.nidnList;

        if (!Array.isArray(nidnList)) {
            return Response.json(
                { message: "nidnList harus berupa array" },
                { status: 400 }
            );
        }

        const normalizedNidnList = nidnList
            .map((nidn: unknown) => String(nidn ?? "").trim())
            .filter(Boolean);

        const dosen = await db.orm.public.Dosen.all();

        const existingNidn = dosen
            .filter((item) => normalizedNidnList.includes(item.nidn))
            .map((item) => item.nidn);

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
