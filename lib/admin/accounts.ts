import type { db } from "@/prisma/db";

type AccountRow = Pick<
    NonNullable<Awaited<ReturnType<typeof db.orm.public.AdminUser.first>>>,
    "id" | "nama" | "email" | "role" | "isActive" | "createdAt" | "updatedAt"
>;

export function toAccountDto(row: AccountRow) {
    return {
        id: row.id,
        nama: row.nama,
        email: row.email,
        role: row.role,
        isActive: row.isActive,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
}

export function validateAccount(nama: string, email: string): string | null {
    if (!nama || nama.length > 200) {
        return "Nama wajib diisi dan maksimal 200 karakter.";
    }
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return "Format email tidak valid atau melebihi 254 karakter.";
    }
    return null;
}

export function validateAccountPassword(password: string): string | null {
    if (password.length < 12 || password.length > 128) {
        return "Password harus 12–128 karakter.";
    }
    return null;
}

export function isSameOriginRequest(request: Request): boolean {
    if (request.headers.get("sec-fetch-site") === "cross-site") {
        return false;
    }
    const origin = request.headers.get("origin");
    return origin === null || origin === new URL(request.url).origin;
}

export function hasSqlState(error: unknown, state: string): boolean {
    const pending: unknown[] = [error];
    const seen = new Set<object>();

    for (let i = 0; i < 16 && pending.length > 0; i++) {
        const value = pending.shift();
        if (!value || typeof value !== "object" || seen.has(value)) continue;
        seen.add(value);
        const item = value as Record<string, unknown>;
        if (item.sqlState === state || item.code === state) return true;
        pending.push(item.cause, item.details, item.meta);
    }
    return false;
}

export class AccountMutationError extends Error {
    constructor(public readonly status: number, message: string) {
        super(message);
        this.name = "AccountMutationError";
    }
}
