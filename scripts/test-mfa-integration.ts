import "dotenv/config";
import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { Secret, TOTP } from "otpauth";
import { decryptMfaSecret, recoveryCodeHash } from "../lib/auth/mfa-crypto";
import {
    MfaVerificationError,
    type MfaProof,
} from "../lib/auth/mfa-verification";

let target: URL;
try {
    target = new URL(process.env.DATABASE_URL ?? "");
} catch {
    console.error("DATABASE_URL tidak valid.");
    process.exit(1);
}

if (
    !["postgres:", "postgresql:"].includes(target.protocol) ||
    target.hostname !== "localhost" ||
    (target.port || "5432") !== "5432" ||
    target.pathname !== "/mm_itbhas"
) {
    console.error("Uji dibatalkan: tujuan bukan database lokal mm_itbhas.");
    process.exit(1);
}

const originalKey = process.env.MFA_ENCRYPTION_KEY;
process.env.MFA_ENCRYPTION_KEY = randomBytes(32).toString("hex");

const { db } = await import("../prisma/db");
const { createSessionRecord } = await import("../lib/auth/session-record");
const {
    runMfaAction,
    MfaManagementError,
} = await import("../lib/auth/mfa-management");

const hash = (value: string) =>
    createHash("sha256").update(value).digest("hex");
const token = () => randomBytes(32).toString("hex");

const passwordHash = `mfa-test-only:${token()}`;
const email = `mfa-test-${randomBytes(12).toString("hex")}@example.invalid`;
const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

let userId: number | null = null;
let phase = "membuat akun sementara";
let passed = false;
let cleaned = false;

function id() {
    if (userId === null) throw new Error("Akun uji belum dibuat.");
    return userId;
}

async function login(
    proof?: MfaProof,
    verifiedPasswordHash = passwordHash,
) {
    return createSessionRecord({
        userId: id(),
        verifiedPasswordHash,
        tokenHash: hash(token()),
        expiresAt,
        mfaProof: proof,
    });
}

async function action(
    currentToken: string,
    name: Parameters<typeof runMfaAction>[0]["action"],
    proof?: MfaProof,
) {
    return runMfaAction({
        userId: id(),
        sessionTokenHash: hash(currentToken),
        verifiedPasswordHash: passwordHash,
        action: name,
        proof,
    });
}

async function expectMfa(
    run: () => Promise<unknown>,
    kind: "required" | "invalid" | "blocked",
) {
    try {
        await run();
    } catch (error) {
        assert.ok(
            error instanceof MfaVerificationError,
            "Jenis penolakan MFA tidak sesuai.",
        );
        assert.equal(error.kind, kind, "Alasan penolakan MFA tidak sesuai.");
        return;
    }
    assert.fail("Permintaan yang seharusnya ditolak justru berhasil.");
}

async function expectManagement(
    run: () => Promise<unknown>,
    status: number,
) {
    try {
        await run();
    } catch (error) {
        assert.ok(
            error instanceof MfaManagementError,
            "Jenis penolakan pengaturan tidak sesuai.",
        );
        assert.equal(error.status, status, "Status penolakan tidak sesuai.");
        return;
    }
    assert.fail("Pengaturan yang seharusnya ditolak justru berhasil.");
}

function totp(secret: string) {
    return new TOTP({
        secret: Secret.fromBase32(secret),
        algorithm: "SHA1",
        digits: 6,
        period: 30,
    }).generate();
}

function exactlyOneAccepted(results: PromiseSettledResult<boolean>[]) {
    let accepted = 0;
    let rejected = 0;

    for (const result of results) {
        if (result.status === "fulfilled") {
            assert.equal(result.value, true);
            accepted++;
        } else {
            assert.ok(
                result.reason instanceof MfaVerificationError &&
                result.reason.kind === "invalid",
                "Penolakan kode bersamaan tidak sesuai.",
            );
            rejected++;
        }
    }

    assert.equal(accepted, 1, "Kode harus diterima tepat sekali.");
    assert.equal(rejected, 1, "Pemakaian kedua harus ditolak.");
}

async function sessionRows() {
    return db.orm.public.AdminSession
        .where({ userId: id() })
        .select("tokenHash", "mfaVersion")
        .all();
}

try {
    const user = await db.orm.public.AdminUser.create({
        nama: "MFA integration test",
        email,
        passwordHash,
        role: "SUPER_ADMIN",
        isActive: true,
    });
    userId = user.id;

    const firstToken = token();
    const secondToken = token();

    for (const current of [firstToken, secondToken]) {
        assert.equal(await createSessionRecord({
            userId,
            verifiedPasswordHash: passwordHash,
            tokenHash: hash(current),
            expiresAt,
        }), true);
    }

    phase = "pembatalan, batas waktu, dan pengikatan aktivasi ke sesi";

    const initial = await action(firstToken, "start");
    assert.ok(initial.payload.kind === "setup");

    await action(firstToken, "cancel");
    let state = await db.orm.public.AdminMfa.where({ userId }).first();
    assert.ok(
        state &&
        state.enabledAt === null &&
        state.pendingSecretEncrypted === null,
    );

    const pending = await action(firstToken, "start");
    assert.ok(pending.payload.kind === "setup");
    const pendingSecret = pending.payload.secret;

    await expectManagement(() => action(secondToken, "confirm", {
        code: totp(pendingSecret),
        recovery: false,
    }), 410);

    await db.orm.public.AdminMfa.where({ userId }).update({
        pendingExpiresAt: new Date(Date.now() - 1000).toISOString(),
    });

    await expectManagement(() => action(firstToken, "confirm", {
        code: "000000",
        recovery: false,
    }), 410);

    const fresh = await action(firstToken, "start");
    assert.ok(fresh.payload.kind === "setup");
    const secret = fresh.payload.secret;

    console.log("LULUS: pembatalan, kedaluwarsa, dan batas sesi aktivasi.");

    phase = "aktivasi dan pencabutan sesi lama";

    const enrollmentCode = totp(secret);
    const activated = await action(firstToken, "confirm", {
        code: enrollmentCode,
        recovery: false,
    });

    assert.ok(activated.payload.kind === "enabled" && activated.session);
    const activeToken = activated.session.token;
    const recoveryCodes = activated.payload.recoveryCodes;

    assert.equal(recoveryCodes.length, 10);
    state = await db.orm.public.AdminMfa.where({ userId }).first();
    assert.ok(
        state?.secretEncrypted &&
        state.enabledAt &&
        state.version === 1,
    );
    assert.ok(decryptMfaSecret(state.secretEncrypted, userId) === secret);

    let sessions = await sessionRows();
    assert.ok(
        sessions.length === 1 &&
        sessions[0].tokenHash === hash(activeToken),
    );

    console.log("LULUS: secret terenkripsi dan penggantian sesi saat aktivasi.");

    phase = "penolakan login tanpa MFA dan kode yang dipakai ulang";

    assert.equal(await login(undefined, "hash-yang-tidak-cocok"), false);
    await expectMfa(() => login(), "required");
    await expectMfa(() => login({
        code: enrollmentCode,
        recovery: false,
    }), "invalid");

    assert.equal((await sessionRows()).length, 1);
    console.log("LULUS: login tanpa MFA dan pemakaian ulang kode ditolak.");

    phase = "kode pemulihan bersamaan";

    exactlyOneAccepted(await Promise.allSettled([
        login({ code: recoveryCodes[0], recovery: true }),
        login({ code: recoveryCodes[0], recovery: true }),
    ]));

    let codes = await db.orm.public.AdminMfaRecoveryCode
        .where({ userId }).select("id").all();

    assert.equal(codes.length, 9);
    console.log("LULUS: kode pemulihan diterima sekali saat digunakan bersamaan.");

    phase = "kode TOTP bersamaan";

    // Penyiapan ulang fixture hanya untuk akun sementara ini.
    await db.orm.public.AdminMfa.where({ userId }).update({
        lastUsedStep: null,
        failedAttempts: 0,
        firstFailedAt: null,
    });

    const concurrentCode = totp(secret);
    exactlyOneAccepted(await Promise.allSettled([
        login({ code: concurrentCode, recovery: false }),
        login({ code: concurrentCode, recovery: false }),
    ]));

    console.log("LULUS: kode TOTP diterima sekali saat digunakan bersamaan.");

    phase = "lima kegagalan bersamaan dan pemblokiran";

    await db.orm.public.AdminMfa.where({ userId }).update({
        failedAttempts: 0,
        firstFailedAt: null,
    });

    const beforeFailures = (await sessionRows()).length;
    const failures = await Promise.allSettled(
        Array.from({ length: 5 }, () =>
            login({ code: "invalid", recovery: false })),
    );

    let invalid = 0;
    let blocked = 0;

    for (const result of failures) {
        assert.ok(
            result.status === "rejected" &&
            result.reason instanceof MfaVerificationError,
        );

        if (result.reason.kind === "invalid") invalid++;
        else if (result.reason.kind === "blocked") blocked++;
        else assert.fail("Alasan penolakan tidak sesuai.");
    }

    assert.equal(invalid, 4);
    assert.equal(blocked, 1);

    state = await db.orm.public.AdminMfa.where({ userId }).first();
    assert.equal(state?.failedAttempts, 5);

    await expectMfa(() => login({
        code: recoveryCodes[1],
        recovery: true,
    }), "blocked");

    assert.equal((await sessionRows()).length, beforeFailures);

    codes = await db.orm.public.AdminMfaRecoveryCode
        .where({ userId }).select("id").all();
    assert.equal(codes.length, 9);

    console.log("LULUS: kegagalan tercatat dan pemblokiran tidak membuat sesi.");

    phase = "penggantian kode pemulihan";

    await db.orm.public.AdminMfa.where({ userId }).update({
        failedAttempts: 0,
        firstFailedAt: null,
    });

    const regenerated = await action(activeToken, "regenerate", {
        code: recoveryCodes[1],
        recovery: true,
    });

    assert.ok(regenerated.payload.kind === "regenerated" && regenerated.session);

    const replacementToken = regenerated.session.token;
    const replacementCodes = regenerated.payload.recoveryCodes;
    const oldHash = recoveryCodeHash(recoveryCodes[2], userId);
    assert.ok(oldHash);

    const oldCode = await db.orm.public.AdminMfaRecoveryCode
        .where({ userId, codeHash: oldHash }).first();
    assert.ok(!oldCode, "Kode pemulihan lama masih tersimpan.");

    sessions = await sessionRows();
    assert.ok(
        sessions.length === 1 &&
        sessions[0].tokenHash === hash(replacementToken),
    );

    await expectManagement(() => action(activeToken, "disable", {
        code: replacementCodes[0],
        recovery: true,
    }), 401);

    console.log("LULUS: penggantian kode pemulihan mencabut kode dan sesi lama.");

    phase = "penonaktifan dan audit";

    const disabled = await action(replacementToken, "disable", {
        code: replacementCodes[0],
        recovery: true,
    });

    assert.ok(disabled.payload.kind === "disabled" && disabled.session);

    state = await db.orm.public.AdminMfa.where({ userId }).first();
    assert.ok(
        state &&
        state.version === 3 &&
        state.enabledAt === null &&
        state.secretEncrypted === null &&
        state.lastUsedStep === null,
    );

    codes = await db.orm.public.AdminMfaRecoveryCode
        .where({ userId }).select("id").all();
    assert.equal(codes.length, 0);

    assert.equal(await login(), true);
    sessions = await sessionRows();
    assert.ok(sessions.every((value) => value.mfaVersion === 3));

    const audits = await db.orm.public.AuditLog
        .where({ userId, entity: "AdminMfa" }).select("id").all();
    assert.equal(audits.length, 3);

    await db.orm.public.AdminUser
        .where({ id: userId }).update({ isActive: false });
    assert.equal(await login(), false);

    await db.orm.public.AdminUser
        .where({ id: userId }).update({ isActive: true, role: "INVALID" });
    assert.equal(await login(), false);

    console.log("LULUS: penonaktifan, audit, dan penolakan akun/peran tidak valid.");
    passed = true;
} catch (error) {
    process.exitCode = 1;
    console.error("Uji gagal pada tahap:", phase);
    console.error(
        "Jenis kesalahan:",
        error instanceof Error ? error.name : "UnknownError",
    );

    if (error instanceof assert.AssertionError) {
        console.error(error.message);
    }
} finally {
    try {
        if (userId !== null) {
            const cleanupId = userId;

            await db.transaction(async (tx) => {
                const removeAudit = db.raw.sql`
                    DELETE FROM public."auditLog"
                    WHERE "userId" = ${cleanupId} RETURNING id
                `.returnsRow({ id: "pg/int4@1" }).build();

                await tx.query(removeAudit);
                await tx.orm.public.AdminUser
                    .where({ id: cleanupId }).delete();
            });
        }
        cleaned = true;
    } catch (error) {
        process.exitCode = 1;
        console.error("Pembersihan gagal. ID akun uji:", userId);
        console.error(error instanceof Error ? error.name : "UnknownError");
    }

    try {
        await db.close();
    } catch {
        process.exitCode = 1;
        console.error("Koneksi pengujian gagal ditutup.");
    }

    if (originalKey === undefined) delete process.env.MFA_ENCRYPTION_KEY;
    else process.env.MFA_ENCRYPTION_KEY = originalKey;
}

if (passed && cleaned && process.exitCode !== 1) {
    console.log("Semua uji transaksi MFA lulus. Akun uji beserta datanya telah dihapus.");
}
