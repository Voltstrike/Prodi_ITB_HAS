import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
    BACKUP_LATE_MS, STATUS_STALE_MS, backupHealth, parseBackupSnapshot,
    parseBackupStatusView, type BackupSnapshot, type BackupStatusView,
} from "../lib/admin/backup-status-model";
import { MAX_BACKUP_STATUS_BYTES, readBackupStatus } from "../lib/admin/backup-status";
import { backupStatusResponse } from "../lib/admin/backup-status-response";

const nowMs = Date.parse("2026-11-16T06:00:00.000Z");
function snapshot(): BackupSnapshot {
    return {
        version: 1, generatedAt: new Date(nowMs).toISOString(),
        schedule: { active: true, nextRunAt: "2026-11-16T19:30:00Z" },
        local: { state: "success", lastSuccessAt: "2026-11-16T04:19:56Z", availableArchives: 14, latestArchiveBytes: 1_546_240 },
        drive: { state: "success", lastSuccessAt: "2026-11-16T04:20:07.705635Z", verifiedArchives: 14, recoveryVerified: true },
    };
}
function view(data = snapshot()): BackupStatusView {
    return { checkedAt: new Date(nowMs).toISOString(), data, reason: null };
}

test("status hanya mengeluarkan metadata yang diizinkan, termasuk setelah lewat API", async () => {
    const raw = { ...snapshot(), MFA_ENCRYPTION_KEY: "PRIVATE-KEY", recovery_file: "/private/path", password: "PRIVATE-PASSWORD" };
    const clean = parseBackupSnapshot(raw, nowMs);
    assert.deepEqual(clean, snapshot());
    const response = await backupStatusResponse({ role: "SUPER_ADMIN" }, async () => ({ ...view(), data: clean }));
    const body = await response.text();
    assert.ok(!body.includes("PRIVATE") && !body.includes("recovery_file"));
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    assert.equal(response.headers.get("vary"), "Cookie");
    assert.equal(parseBackupStatusView(JSON.parse(body)).data?.drive.verifiedArchives, 14);
});

test("tanpa login, ADMIN, dan peran lain ditolak sebelum membaca sumber status", async () => {
    for (const user of [null, { role: "ADMIN" }, { role: "super_admin" }, { role: "UNKNOWN" }]) {
        const response = await backupStatusResponse(user, async () => {
            assert.fail("Pembaca status tidak boleh dipanggil.");
        });
        assert.equal(response.status, 403);
        assert.deepEqual(await response.json(), { message: "Akses ditolak" });
        assert.equal(response.headers.get("cache-control"), "private, no-store");
    }
});

test("data kadaluwarsa dan backup lebih dari 26 jam tidak dianggap sehat", () => {
    const data = snapshot();
    assert.equal(backupHealth(view(data)), "healthy");
    const older = view(data);
    older.checkedAt = new Date(nowMs + STATUS_STALE_MS + 1).toISOString();
    assert.equal(backupHealth(older), "stale");
    data.drive.lastSuccessAt = new Date(nowMs - BACKUP_LATE_MS - 1).toISOString();
    assert.equal(backupHealth(view(data)), "late");
});

test("kegagalan, proses berjalan, jadwal mati, data parsial, dan pemulihan belum diperiksa dibedakan", () => {
    for (const [mutate, expected] of [
        [(s: BackupSnapshot) => { s.drive.state = "failed"; }, "failed"],
        [(s: BackupSnapshot) => { s.local.state = "running"; }, "running"],
        [(s: BackupSnapshot) => { s.schedule.active = false; }, "paused"],
        [(s: BackupSnapshot) => { s.drive.lastSuccessAt = null; }, "pending"],
        [(s: BackupSnapshot) => { s.local.availableArchives = 0; }, "pending"],
        [(s: BackupSnapshot) => { s.drive.recoveryVerified = false; }, "unverified"],
    ] as const) {
        const data = snapshot(); mutate(data);
        assert.equal(backupHealth(view(data)), expected);
    }
    assert.equal(backupHealth({ ...view(), data: null, reason: "missing" }), "unavailable");
});

test("tanggal rusak atau dari masa depan serta ukuran dan state tidak valid ditolak", () => {
    for (const mutate of [
        (s: BackupSnapshot) => { s.generatedAt = "2026-02-31T06:00:00Z"; },
        (s: BackupSnapshot) => { s.generatedAt = "2026-11-16T06:10:00Z"; },
        (s: BackupSnapshot) => { s.drive.lastSuccessAt = "2026-11-17T04:00:00Z"; },
        (s: BackupSnapshot) => { s.local.latestArchiveBytes = -1; },
        (s: BackupSnapshot) => { s.drive.verifiedArchives = Number.MAX_SAFE_INTEGER + 1; },
    ]) {
        const data = snapshot(); mutate(data);
        assert.throws(() => parseBackupSnapshot(data, nowMs));
    }
    assert.throws(() => parseBackupSnapshot({ ...snapshot(), local: { ...snapshot().local, state: "password" } }, nowMs));
});

test("pembaca status menangani berkas hilang, JSON rusak, symlink, direktori, dan ukuran berlebihan", async () => {
    const directory = await mkdtemp(join(tmpdir(), "itbhas-backup-status-"));
    try {
        const file = join(directory, "status.json");
        assert.equal((await readBackupStatus(file, nowMs)).reason, "missing");
        await writeFile(file, JSON.stringify(snapshot()));
        assert.equal(backupHealth(await readBackupStatus(file, nowMs)), "healthy");
        await writeFile(file, "PRIVATE-CONTENT");
        assert.equal((await readBackupStatus(file, nowMs)).reason, "invalid");
        const linked = join(directory, "link.json");
        await symlink(file, linked);
        assert.equal((await readBackupStatus(linked, nowMs)).data, null);
        const folder = join(directory, "folder.json");
        await mkdir(folder);
        assert.equal((await readBackupStatus(folder, nowMs)).data, null);
        await writeFile(file, "x".repeat(MAX_BACKUP_STATUS_BYTES + 1));
        assert.equal((await readBackupStatus(file, nowMs)).reason, "invalid");
        assert.equal((await readBackupStatus("relative.json", nowMs)).reason, "invalid");
        assert.ok(!JSON.stringify(await readBackupStatus(file, nowMs)).includes(directory));
    } finally { await rm(directory, { recursive: true, force: true }); }
});
