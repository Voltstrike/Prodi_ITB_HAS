import "dotenv/config";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { db } from "../prisma/db";
import { hashPassword } from "../lib/auth/password";
import { getAuditLogsPage, type AuditLogPage } from "../lib/admin/audit-log-list";
import { parseAuditLogFilters } from "../lib/admin/audit-log-filters";

const base = "http://localhost:3000";
const suffix = randomUUID();
const prefix = `audit-fixture-${suffix}`;
const superEmail = `audit-super-${suffix}@example.invalid`;
const adminEmail = `audit-admin-${suffix}@example.invalid`;
const password = randomBytes(32).toString("base64url");
const userIds: number[] = [];
let passed = false;
let cleaned = false;

function filters(values: Record<string, string>) {
    const parsed = parseAuditLogFilters(new URLSearchParams(values));
    if (!parsed.ok) throw new Error(parsed.message);
    return parsed.filters;
}

async function read(values: Record<string, string>) {
    return getAuditLogsPage(filters(values));
}

async function http(
    path: string,
    cookie = "",
    options: RequestInit = {},
): Promise<Response> {
    const headers = new Headers(options.headers);
    if (cookie) headers.set("Cookie", cookie);

    return fetch(base + path, {
        ...options,
        headers,
        redirect: "manual",
        signal: AbortSignal.timeout(20_000),
    });
}

function assertNoStore(response: Response) {
    assert.match(response.headers.get("cache-control") ?? "", /no-store/);
}

async function login(email: string): Promise<string> {
    const response = await http("/api/auth/login", "", {
        method: "POST",
        headers: {
            Origin: base,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
    });

    assert.equal(response.status, 200, "Login akun uji gagal.");

    const payload = await response.json() as { requiresMfa?: boolean };
    assert.notEqual(payload.requiresMfa, true);

    const cookie = (response.headers.get("set-cookie") ?? "")
        .match(/(?:^|,\s*)admin_session=([^;,\s]+)/)?.[1];

    assert.ok(cookie, "Cookie sesi akun uji tidak tersedia.");
    return `admin_session=${cookie}`;
}

async function assertPageDenied(
    response: Response,
    destination: string,
) {
    const html = await response.text();

    if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        assert.ok(location, "Tujuan redirect tidak tersedia.");
        assert.equal(new URL(location, base).pathname, destination);
    } else {
        assert.equal(response.status, 200);
        assert.ok(html.includes("NEXT_REDIRECT"), "Halaman tidak menolak akses.");
    }

    assert.ok(!html.includes("Telusuri aktivitas administrasi yang dicatat aplikasi."));
    assert.ok(!html.includes(prefix), "Catatan audit muncul pada respons tanpa akses.");
}

try {
    const target = new URL(process.env.DATABASE_URL ?? "");

    if (
        !["postgres:", "postgresql:"].includes(target.protocol) ||
        target.hostname !== "localhost" ||
        (target.port || "5432") !== "5432" ||
        target.pathname !== "/mm_itbhas"
    ) {
        throw new Error("Pengujian hanya boleh memakai database lokal mm_itbhas.");
    }

    const anonymous = await http("/api/admin/audit-log");
    assert.equal(anonymous.status, 403);
    assertNoStore(anonymous);

    for (const [email, nama, role] of [
        [superEmail, `Audit %_${suffix}`, "SUPER_ADMIN"],
        [adminEmail, `Audit AB${suffix}`, "ADMIN"],
    ]) {
        const user = await db.orm.public.AdminUser.create({
            nama,
            email,
            role,
            isActive: true,
            passwordHash: await hashPassword(password),
        });
        userIds.push(user.id);
    }

    const eligibleIds: number[] = [];

    await db.transaction(async (tx) => {
        for (let index = 0; index < 29; index++) {
            const details = index === 5
                ? `${prefix} literal 100%_\\`
                : index === 6
                    ? `${prefix} literal 100ABX`
                    : index === 7
                        ? `${prefix} <script>window.__AUDIT_LOG_TEST__=true</script>`
                        : `${prefix} catatan ${index}`;

            const log = await tx.orm.public.AuditLog.create({
                userId: userIds[0],
                action: index % 2 === 0 ? "CREATE" : "UPDATE",
                entity: "Berita",
                entityId: 1,
                details,
                createdAt: "2026-11-08T17:00:00.000Z",
            });
            eligibleIds.push(log.id);
        }

        for (const createdAt of [
            "2026-11-08T16:59:59.999Z",
            "2026-11-09T17:00:00.000Z",
        ]) {
            await tx.orm.public.AuditLog.create({
                userId: userIds[0],
                action: "CREATE",
                entity: "Berita",
                entityId: 1,
                details: `${prefix} di luar rentang`,
                createdAt,
            });
        }

        await tx.orm.public.AuditLog.create({
            userId: userIds[1],
            action: "UPDATE",
            entity: "AdminMfa",
            entityId: 1,
            details: `${prefix} akun pembanding`,
            createdAt: "2026-11-09T00:00:00.000Z",
        });
    });

    const scope = {
        q: prefix,
        actor: superEmail,
        from: "2026-11-09",
        to: "2026-11-09",
    };

    const first = await read(scope);
    const second = await read({ ...scope, page: "2" });
    const expected = [...eligibleIds].reverse();

    assert.equal(first.total, 29);
    assert.equal(first.totalPages, 2);
    assert.deepEqual(first.logs.map((log) => log.id), expected.slice(0, 25));
    assert.deepEqual(second.logs.map((log) => log.id), expected.slice(25));

    const last = await read({
        ...scope,
        page: String(Number.MAX_SAFE_INTEGER),
    });
    assert.equal(last.page, 2);
    assert.deepEqual(last.logs.map((log) => log.id), expected.slice(25));

    console.log("LULUS: batas hari WIB, urutan ID saat waktu sama, dan pagination.");

    const literalActor = await read({
        ...scope,
        actor: `Audit %_${suffix}`,
    });
    assert.equal(literalActor.total, 29);

    const literalSearch = await read({
        ...scope,
        q: `${prefix} literal 100%_\\`,
    });
    assert.equal(literalSearch.total, 1);

    const injection = await read({
        ...scope,
        q: `${prefix} ' OR 1=1 --`,
    });
    assert.equal(injection.total, 0);

    const created = await read({ ...scope, action: "CREATE" });
    assert.equal(created.total, 15);

    const mfa = await read({
        ...scope,
        actor: "",
        entity: "AdminMfa",
    });
    assert.equal(mfa.total, 1);
    assert.equal(mfa.logs[0].userId, userIds[1]);

    console.log("LULUS: filter admin, tindakan, objek, dan pencarian karakter literal.");

    const superCookie = await login(superEmail);
    const adminCookie = await login(adminEmail);

    const denied = await http("/api/admin/audit-log", adminCookie);
    assert.equal(denied.status, 403);
    assertNoStore(denied);

    const query = new URLSearchParams(scope).toString();
    const allowed = await http(`/api/admin/audit-log?${query}`, superCookie);
    assert.equal(allowed.status, 200);
    assertNoStore(allowed);

    const payload = await allowed.json() as AuditLogPage;
    assert.equal(payload.total, 29);
    assert.deepEqual(payload.logs.map((log) => log.id), expected.slice(0, 25));

    const allowedKeys = [
        "id", "userId", "actorName", "actorEmail", "action",
        "entity", "entityId", "details", "createdAt",
    ].sort();

    for (const log of payload.logs) {
        assert.deepEqual(Object.keys(log).sort(), allowedKeys);
    }

    assert.ok(!JSON.stringify(payload).includes(password));

    for (const invalidQuery of [
        "from=2026-02-29",
        "page=0",
        "action=CREATE&action=DELETE",
    ]) {
        const response = await http(
            `/api/admin/audit-log?${invalidQuery}`,
            superCookie,
        );
        assert.equal(response.status, 400);
        assertNoStore(response);
    }

    const unsupported = await http("/api/admin/audit-log", superCookie, {
        method: "POST",
        headers: { Origin: base },
    });
    assert.equal(unsupported.status, 405);

    console.log("LULUS: akses API, validasi HTTP, no-store, dan field respons.");

    await assertPageDenied(
        await http("/admin/audit-log"),
        "/admin/login",
    );
    await assertPageDenied(
        await http("/admin/audit-log", adminCookie),
        "/admin",
    );

    const page = await http(`/admin/audit-log?${query}`, superCookie);
    assert.equal(page.status, 200);
    const html = await page.text();

    assert.ok(html.includes("Telusuri aktivitas administrasi yang dicatat aplikasi."));
    assert.ok(
        html.includes("&lt;script&gt;window.__AUDIT_LOG_TEST__=true&lt;/script&gt;"),
        "Detail audit tidak dirender sebagai teks yang di-escape.",
    );

    const regularDashboard = await http("/admin", adminCookie);
    assert.equal(regularDashboard.status, 200);
    const regularHtml = await regularDashboard.text();

    assert.ok(!regularHtml.includes("Aktivitas Terbaru"));
    assert.ok(!regularHtml.includes('href="/admin/audit-log"'));
    assert.ok(!regularHtml.includes(prefix));

    const superDashboard = await http("/admin", superCookie);
    assert.equal(superDashboard.status, 200);
    const superHtml = await superDashboard.text();

    assert.ok(superHtml.includes("Aktivitas Terbaru"));
    assert.ok(superHtml.includes('href="/admin/audit-log"'));

    console.log("LULUS: akses halaman, escape HTML, menu, dan pembatasan dashboard.");
    passed = true;
} catch (error) {
    process.exitCode = 1;
    const message = error instanceof Error ? error.message : "Kesalahan tidak dikenal.";
    console.error(message.replace(
        /postgres(?:ql)?:\/\/[^\s"'<>]+/gi,
        "[URL database disamarkan]",
    ));
} finally {
    try {
        if (userIds.length > 0) {
            await db.transaction(async (tx) => {
                for (const userId of userIds) {
                    const removeAudit = db.raw.sql`
                        DELETE FROM public."auditLog"
                        WHERE "userId" = ${userId}
                        RETURNING id
                    `.returnsRow({ id: "pg/int4@1" }).build();

                    await tx.query(removeAudit);

                    await tx.orm.public.AdminUser
                        .where({ id: userId })
                        .delete();
                }
            });
        }
        cleaned = true;
    } catch (error) {
        process.exitCode = 1;
        console.error("Pembersihan gagal. ID akun uji:", userIds);
        console.error(error instanceof Error ? error.name : "UnknownError");
    }

    try {
        await db.close();
    } catch {
        process.exitCode = 1;
        console.error("Koneksi pengujian gagal ditutup.");
    }
}

if (passed && cleaned && process.exitCode !== 1) {
    console.log("Semua uji Audit Log lulus. Akun, sesi, dan catatan uji telah dihapus.");
}
