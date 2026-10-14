import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { deleteSession, getSessionTokenHash } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
    checkLoginRateLimit,
    recordLoginFailure,
} from "@/lib/auth/rate-limit";
import { requireSameOriginRequest } from "@/lib/http/origin";
import { readJsonObjectBody } from "@/lib/http/json";
import {
    AccountMutationError,
    hasSqlState,
    validateAccount,
} from "@/lib/admin/accounts";
import { updateOwnAccountProfile } from "@/lib/admin/account-profile";

function profileJson(
    body: Record<string, unknown>,
    status = 200,
    headers: Record<string, string> = {},
) {
    return Response.json(body, {
        status,
        headers: { "Cache-Control": "no-store", ...headers },
    });
}

function rateLimitResponse(retryAfterSeconds: number) {
    return profileJson(
        {
            message: "Terlalu banyak percobaan verifikasi. Silakan coba lagi nanti.",
        },
        429,
        { "Retry-After": String(retryAfterSeconds) },
    );
}

export async function PATCH(request: Request) {
    const originError = requireSameOriginRequest(request);
    if (originError) return originError;

    try {
        const user = await requireAdminApi();
        const sessionTokenHash = user ? await getSessionTokenHash() : null;

        if (!user || !sessionTokenHash) {
            return profileJson(
                {
                    message: "Silakan login kembali.",
                    requiresLogin: true,
                },
                401,
            );
        }

        const result = await readJsonObjectBody(request, 4 * 1024);
        if (!result.ok) {
            result.response.headers.set("Cache-Control", "no-store");
            return result.response;
        }

        const body = result.body;
        const allowedFields = ["nama", "email", "currentPassword"];

        if (Object.keys(body).some((key) => !allowedFields.includes(key))) {
            return profileJson({ message: "Field profil tidak valid." }, 400);
        }

        const nama = typeof body.nama === "string" ? body.nama.trim() : "";
        const email =
            typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
        const currentPassword =
            typeof body.currentPassword === "string" ? body.currentPassword : "";

        const invalid = validateAccount(nama, email);
        if (invalid) return profileJson({ message: invalid }, 400);

        if (!currentPassword || currentPassword.length > 128) {
            return profileJson(
                { message: "Password saat ini wajib diisi dan maksimal 128 karakter." },
                400,
            );
        }

        const rateLimitKey = user.email.toLowerCase();
        const limit = await checkLoginRateLimit(rateLimitKey);
        if (!limit.allowed) {
            return rateLimitResponse(limit.retryAfterSeconds);
        }

        if (!(await verifyPassword(currentPassword, user.passwordHash))) {
            const failure = await recordLoginFailure(rateLimitKey);
            if (!failure.allowed) {
                return rateLimitResponse(failure.retryAfterSeconds);
            }

            return profileJson(
                { message: "Password saat ini salah." },
                401,
            );
        }

        // Password yang sama diberi hash baru ketika email berubah.
        const passwordHashForEmailChange =
            email !== user.email ? await hashPassword(currentPassword) : null;

        const updated = await updateOwnAccountProfile({
            userId: user.id,
            sessionTokenHash,
            expectedEmail: user.email,
            verifiedPasswordHash: user.passwordHash,
            nama,
            email,
            passwordHashForEmailChange,
        });

        if (updated.requiresLogin) {
            await deleteSession();
        }

        return profileJson({
            ...updated,
            message: updated.requiresLogin
                ? "Email diperbarui. Silakan login kembali dengan email baru."
                : updated.changed
                    ? "Profil akun berhasil diperbarui."
                    : "Tidak ada perubahan profil.",
        });
    } catch (error) {
        if (error instanceof AccountMutationError) {
            return profileJson(
                {
                    message: error.message,
                    requiresLogin: error.status === 401,
                },
                error.status,
            );
        }

        if (hasSqlState(error, "23505")) {
            return profileJson(
                { message: "Email sudah digunakan akun lain." },
                409,
            );
        }

        console.error(
            "UPDATE OWN PROFILE ERROR:",
            error instanceof Error ? error.name : "UnknownError",
        );

        return profileJson(
            { message: "Gagal memperbarui profil akun." },
            500,
        );
    }
}
