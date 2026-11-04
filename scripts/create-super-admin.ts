import "dotenv/config";
import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import { db } from "../prisma/db";
import {
    validateAccount,
    validateAccountPassword,
} from "../lib/admin/accounts";
import { hashPassword } from "../lib/auth/password";
import { createAuditLog } from "../lib/audit/log";

class BootstrapError extends Error {}

function databaseTarget(): string {
    let url: URL;

    try {
        url = new URL(process.env.DATABASE_URL ?? "");
    } catch {
        throw new BootstrapError("DATABASE_URL tidak valid.");
    }

    const database = decodeURIComponent(url.pathname.slice(1));

    if (
        !["postgres:", "postgresql:"].includes(url.protocol) ||
        !url.hostname ||
        !/^[a-zA-Z0-9_-]{1,63}$/.test(database)
    ) {
        throw new BootstrapError("Tujuan database tidak valid.");
    }

    return database + "@" + url.hostname + ":" + (url.port || "5432");
}

async function readAccount(target: string) {
    let hidden = false;
    const controller = new AbortController();

    const terminal = new Writable({
        write(chunk, encoding, callback) {
            if (hidden) {
                callback();
                return;
            }

            stdout.write(chunk, encoding, callback);
        },
    });

    const rl = createInterface({
        input: stdin,
        output: terminal,
        terminal: true,
        historySize: 0,
    });

    rl.on("SIGINT", () => {
        controller.abort();
        rl.close();
    });

    rl.on("close", () => controller.abort());

    const ask = (prompt: string) =>
        rl.question(prompt, { signal: controller.signal });

    async function secret(prompt: string): Promise<string> {
        stdout.write(prompt);
        hidden = true;

        try {
            return await ask("");
        } finally {
            hidden = false;
            stdout.write("\n");
        }
    }

    try {
        const expected = "BUAT " + target;
        const confirmation = await ask("Ketik " + expected + ": ");

        if (confirmation !== expected) {
            throw new BootstrapError(
                "Konfirmasi tidak cocok. Dibatalkan.",
            );
        }

        const nama = (await ask("Nama Super Admin: ")).trim();
        const email = (await ask("Email Super Admin: "))
            .trim()
            .toLowerCase();

        const invalidAccount = validateAccount(nama, email);

        if (invalidAccount) {
            throw new BootstrapError(invalidAccount);
        }

        const password = await secret("Password (15-128 karakter): ");
        const invalidPassword = validateAccountPassword(password);

        if (invalidPassword) {
            throw new BootstrapError(invalidPassword);
        }

        if (password.length < 15) {
            throw new BootstrapError(
                "Password Super Admin pertama minimal 15 karakter.",
            );
        }

        const confirmationPassword = await secret("Ulangi password: ");

        if (password !== confirmationPassword) {
            throw new BootstrapError("Konfirmasi password tidak cocok.");
        }

        return { nama, email, password };
    } catch (error) {
        if (controller.signal.aborted) {
            throw new BootstrapError("Input dibatalkan.");
        }

        throw error;
    } finally {
        hidden = false;
        rl.close();
        terminal.end();
    }
}

async function main() {
    const mode = process.argv[2] ?? "--check";

    if (
        process.argv.length > 3 ||
        !["--check", "--apply"].includes(mode)
    ) {
        throw new BootstrapError("Gunakan --check atau --apply.");
    }

    const apply = mode === "--apply";

    if (apply && (!stdin.isTTY || !stdout.isTTY)) {
        throw new BootstrapError(
            "--apply harus dijalankan di terminal interaktif.",
        );
    }

    const target = databaseTarget();
    console.log("Tujuan database: " + target);

    const existing = await db.orm.public.AdminUser
        .select("id")
        .first();

    if (!apply) {
        console.log(
            existing
                ? "Bootstrap ditolak: sudah ada akun admin."
                : "Tabel akun admin kosong. Bootstrap dapat dilanjutkan dengan --apply.",
        );
        console.log("Mode pemeriksaan: tidak ada data yang ditulis.");
        return;
    }

    if (existing) {
        throw new BootstrapError(
            "Sudah ada akun admin. Skrip ini hanya untuk akun pertama.",
        );
    }

    const { nama, email, password } = await readAccount(target);
    const passwordHash = await hashPassword(password);

    const created = await db.transaction(async (tx) => {
        const lock = db.raw.sql`
            SELECT 1::integer AS locked
            FROM pg_advisory_xact_lock(129690, 1)
        `.returnsRow({ locked: "pg/int4@1" }).build();

        await tx.query(lock);

        const account = await tx.orm.public.AdminUser
            .select("id")
            .first();

        if (account) {
            throw new BootstrapError(
                "Akun admin sudah dibuat oleh proses lain. Dibatalkan.",
            );
        }

        const user = await tx.orm.public.AdminUser.create({
            nama,
            email,
            passwordHash,
            role: "SUPER_ADMIN",
            isActive: true,
        });

        await createAuditLog({
            userId: user.id,
            action: "CREATE",
            entity: "AdminUser",
            entityId: user.id,
            details: "Bootstrap akun Super Admin pertama: " + user.email + ".",
            dbClient: tx,
        });

        return user;
    });

    console.log("Super Admin berhasil dibuat: " + created.email);
}

try {
    await main();
} catch (error) {
    console.error(
        error instanceof BootstrapError
            ? error.message
            : "Bootstrap gagal: " +
                (error instanceof Error ? error.name : "UnknownError"),
    );

    process.exitCode = 1;
} finally {
    try {
        await db.close();
    } catch {
        console.error("Koneksi database gagal ditutup.");
        process.exitCode = 1;
    }
}
