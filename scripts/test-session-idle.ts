import "dotenv/config";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";

let target: URL;
try {
    target = new URL(process.env.DATABASE_URL ?? "");
} catch {
    throw new Error("DATABASE_URL tidak valid.");
}
if (
    !["postgres:", "postgresql:"].includes(target.protocol) ||
    !["localhost", "127.0.0.1", "[::1]"].includes(target.hostname) ||
    (target.port || "5432") !== "5432" ||
    target.pathname !== "/mm_itbhas"
) throw new Error("Uji dibatasi ke database lokal mm_itbhas port 5432.");

const { db } = await import("../prisma/db");
const { publicSessionState, readActiveAdminSession, recordAdminActivity } =
    await import("../lib/auth/session-lifecycle");
const { runMfaAction, MfaManagementError } =
    await import("../lib/auth/mfa-management");

const minute = 60_000;
const iso = (time: number) => new Date(time).toISOString();
const random = () => randomBytes(32).toString("hex");
const passwordHash = `idle-test:${random()}`;
let userId: number | null = null;
let passed = false;
let phase = "membuat akun sementara";

async function fixture(overrides: Partial<{
    createdAt: string;
    lastActivityAt: string;
    expiresAt: string;
    mfaVersion: number;
}> = {}) {
    assert.ok(userId !== null);
    const now = Date.now();
    return db.orm.public.AdminSession.create({
        userId,
        tokenHash: random(),
        createdAt: iso(now - 10 * minute),
        lastActivityAt: iso(now - 5 * minute),
        expiresAt: iso(now + 7 * 60 * minute),
        mfaVersion: 0,
        ...overrides,
    });
}

try {
    const user = await db.orm.public.AdminUser.create({
        nama: "Uji sesi idle sementara",
        email: `idle-${random()}@example.invalid`,
        passwordHash,
        role: "SUPER_ADMIN",
        isActive: true,
    });
    userId = user.id;

    phase = "pembacaan tanpa memperpanjang sesi";
    const active = await fixture();
    const first = await readActiveAdminSession(active.tokenHash);
    assert.ok(first);
    const second = await readActiveAdminSession(active.tokenHash);
    assert.ok(second);
    assert.equal(second.session.lastActivityAt, first.session.lastActivityAt);
    assert.equal(second.deadlines.expiresAt, first.deadlines.expiresAt);
    assert.deepEqual(Object.keys(publicSessionState(first)).sort(), [
        "absoluteExpiresAt", "expiresAt", "idleExpiresAt", "serverNow", "sessionId",
    ]);
    console.log("LULUS: status tidak memperpanjang sesi dan tidak membocorkan kredensial.");

    phase = "identitas sesi tab lama";
    assert.equal((await recordAdminActivity(active.tokenHash, active.id + 1)).kind, "changed");
    const unchanged = await db.orm.public.AdminSession.where({ id: active.id }).first();
    assert.equal(unchanged?.lastActivityAt, active.lastActivityAt);
    console.log("LULUS: identitas sesi berbeda tidak memperpanjang sesi baru.");

    phase = "aktivitas bersamaan dan batas absolut";
    const results = await Promise.all([
        recordAdminActivity(active.tokenHash, active.id),
        recordAdminActivity(active.tokenHash, active.id),
    ]);
    assert.ok(results.every((result) => result.kind === "active"));
    const updated = await readActiveAdminSession(active.tokenHash);
    assert.ok(updated);
    assert.ok(Date.parse(updated.session.lastActivityAt) > Date.parse(active.lastActivityAt));
    assert.equal(updated.session.expiresAt, active.expiresAt);
    assert.ok(updated.deadlines.expiresAt <= updated.deadlines.absoluteExpiresAt);
    console.log("LULUS: aktivitas bersamaan tercatat tanpa mengubah batas absolut.");

    phase = "sesi idle dan kedaluwarsa tidak boleh hidup kembali";
    const now = Date.now();
    const expiredSessions = [
        await fixture({ createdAt: iso(now - 60 * minute), lastActivityAt: iso(now - 31 * minute) }),
        await fixture({ createdAt: iso(now - 481 * minute), lastActivityAt: iso(now) }),
        await fixture({ expiresAt: iso(now - minute) }),
    ];
    for (const session of expiredSessions) {
        assert.equal(await readActiveAdminSession(session.tokenHash), null);
        assert.equal((await recordAdminActivity(session.tokenHash, session.id)).kind, "expired");
        const saved = await db.orm.public.AdminSession.where({ id: session.id }).first();
        assert.equal(saved?.lastActivityAt, session.lastActivityAt);
    }
    console.log("LULUS: sesi idle, batas delapan jam, dan expiry lama tidak dapat dihidupkan kembali.");

    phase = "MFA tidak boleh memutar sesi idle";
    await assert.rejects(() => runMfaAction({
        userId: user.id,
        sessionTokenHash: expiredSessions[0].tokenHash,
        verifiedPasswordHash: passwordHash,
        action: "cancel",
    }), (error: unknown) => error instanceof MfaManagementError && error.status === 401);
    console.log("LULUS: perubahan MFA menolak sesi idle.");

    phase = "akun nonaktif dan peran tidak valid";
    for (const patch of [{ isActive: false }, { isActive: true, role: "INVALID" }]) {
        await db.orm.public.AdminUser.where({ id: user.id }).update(patch);
        assert.equal(await readActiveAdminSession(active.tokenHash), null);
        assert.equal((await recordAdminActivity(active.tokenHash, active.id)).kind, "expired");
    }
    await db.orm.public.AdminUser.where({ id: user.id }).update({ isActive: true, role: "SUPER_ADMIN" });

    phase = "versi MFA dan sesi dicabut";
    await db.orm.public.AdminMfa.create({ userId: user.id, version: 1 });
    assert.equal(await readActiveAdminSession(active.tokenHash), null);
    assert.equal((await recordAdminActivity(active.tokenHash, active.id)).kind, "expired");
    await db.orm.public.AdminSession.where({ id: active.id }).delete();
    assert.equal(await readActiveAdminSession(active.tokenHash), null);
    assert.equal((await recordAdminActivity(active.tokenHash, active.id)).kind, "expired");
    console.log("LULUS: akun/peran tidak valid, versi MFA lama, dan sesi dicabut ditolak.");
    passed = true;
} catch (error) {
    process.exitCode = 1;
    console.error("Uji gagal pada tahap:", phase);
    console.error("Jenis kesalahan:", error instanceof Error ? error.name : "UnknownError");
    if (error instanceof assert.AssertionError) console.error(error.message);
} finally {
    try {
        if (userId !== null) {
            await db.orm.public.AdminUser.where({ id: userId }).delete();
        }
        console.log("Akun uji dan sesi sementara telah dibersihkan.");
    } catch {
        process.exitCode = 1;
        console.error("Pembersihan gagal. ID akun uji:", userId);
    } finally {
        await db.close();
    }
}

if (passed && process.exitCode !== 1) console.log("UJI DATABASE SESI IDLE LULUS.");
