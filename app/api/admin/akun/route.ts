import { requireSameOriginRequest } from "@/lib/http/origin";
import { getAccountsPage } from "@/lib/admin/account-list";
import { db } from "@/prisma/db";
import { requireSuperAdminApi } from "@/lib/auth/require-super-admin-api";
import { hashPassword } from "@/lib/auth/password";
import { createAuditLog } from "@/lib/audit/log";
import { readJsonObjectBody } from "@/lib/http/json";
import {
    hasSqlState,
    toAccountDto,
    validateAccount,
    validateAccountPassword,
} from "@/lib/admin/accounts";

export async function GET(request: Request) {
    const admin = await requireSuperAdminApi();
    if (!admin) {
        return Response.json({ message: "Akses ditolak" }, { status: 403 });
    }

    try {
        const result = await getAccountsPage(
            new URL(request.url).searchParams.get("page") ?? "1",
        );
        return Response.json(result, {
            headers: { "Cache-Control": "no-store" },
        });
    } catch {
        return Response.json(
            { message: "Gagal mengambil daftar akun" },
            { status: 500 },
        );
    }
}

export async function POST(request: Request) {
    const originError = requireSameOriginRequest(request);
    if (originError) {
        return originError;
    }

    const admin = await requireSuperAdminApi();
    if (!admin) {
        return Response.json({ message: "Akses ditolak" }, { status: 403 });
    }

    try {
        const result = await readJsonObjectBody(request, 8 * 1024);
        if (!result.ok) return result.response;
        const body = result.body;

        if (Object.keys(body).some((key) => !["nama", "email", "password"].includes(key))) {
            return Response.json({ message: "Field akun tidak valid" }, { status: 400 });
        }

        const nama = typeof body.nama === "string" ? body.nama.trim() : "";
        const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
        const password = typeof body.password === "string" ? body.password : "";
        const invalid = validateAccount(nama, email) || validateAccountPassword(password);
        if (invalid) {
            return Response.json({ message: invalid }, { status: 400 });
        }

        const duplicate = await db.orm.public.AdminUser
            .where({ email })
            .select("id")
            .first();
        if (duplicate) {
            return Response.json({ message: "Email sudah terdaftar" }, { status: 409 });
        }

        const passwordHash = await hashPassword(password);
        const account = await db.transaction(async (tx) => {
            const created = await tx.orm.public.AdminUser.create({
                nama,
                email,
                passwordHash,
                role: "ADMIN",
                isActive: true,
            });

            await createAuditLog({
                userId: admin.id,
                action: "CREATE",
                entity: "AdminUser",
                entityId: created.id,
                details: `Membuat akun admin ${created.email}.`,
                dbClient: tx,
            });

            return created;
        });

        return Response.json(toAccountDto(account), { status: 201 });
    } catch (error) {
        if (hasSqlState(error, "23505")) {
            return Response.json({ message: "Email sudah terdaftar" }, { status: 409 });
        }
        console.error("CREATE ACCOUNT ERROR:", error instanceof Error ? error.name : "UnknownError");
        return Response.json({ message: "Gagal membuat akun" }, { status: 500 });
    }
}
