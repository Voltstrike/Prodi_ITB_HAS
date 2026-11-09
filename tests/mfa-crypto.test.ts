import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { afterEach, beforeEach, test } from "node:test";
import {
    assertMfaKeyConfigured, createRecoveryCodes, createTotpSetup,
    decryptMfaSecret, encryptMfaSecret, recoveryCodeHash, verifyTotpStep,
} from "../lib/auth/mfa-crypto";

const secret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
const originalKey = process.env.MFA_ENCRYPTION_KEY;

beforeEach(() => {
    process.env.MFA_ENCRYPTION_KEY = randomBytes(32).toString("hex");
});

afterEach(() => {
    if (originalKey === undefined) delete process.env.MFA_ENCRYPTION_KEY;
    else process.env.MFA_ENCRYPTION_KEY = originalKey;
});

test("TOTP cocok dengan enam vektor SHA1 RFC 6238", () => {
    const vectors: [number, string][] = [
        [59, "287082"], [1111111109, "081804"], [1111111111, "050471"],
        [1234567890, "005924"], [2000000000, "279037"], [20000000000, "353130"],
    ];
    for (const [seconds, token] of vectors) {
        assert.equal(
            verifyTotpStep(secret, token, -1, seconds * 1000),
            Math.floor(seconds / 30),
        );
    }
});

test("kode yang pernah dipakai ditolak", () => {
    assert.equal(verifyTotpStep(secret, "287082", 0, 59000), 1);
    assert.equal(verifyTotpStep(secret, "287082", 1, 59000), null);
    assert.equal(verifyTotpStep(secret, "287082", 2, 59000), null);
});

test("toleransi waktu hanya satu periode", () => {
    assert.equal(verifyTotpStep(secret, "287082", -1, 89000), 1);
    assert.equal(verifyTotpStep(secret, "287082", -1, 119000), null);
});

test("format kode tidak valid ditolak", () => {
    for (const token of ["", "28708", "2870820", "28708a", " 287082", "２８７０８２"]) {
        assert.equal(verifyTotpStep(secret, token, -1, 59000), null);
    }
});

test("secret terenkripsi dapat dibuka, nonce berbeda setiap enkripsi", () => {
    const first = encryptMfaSecret(secret, 1);
    const second = encryptMfaSecret(secret, 1);
    assert.notEqual(first, second);
    assert.equal(first.includes(secret), false);
    assert.equal(decryptMfaSecret(first, 1), secret);
});

test("ciphertext tidak dapat dipindah ke akun lain", () => {
    const encrypted = encryptMfaSecret(secret, 1);
    assert.throws(() => decryptMfaSecret(encrypted, 2));
});

test("perubahan tag atau ciphertext ditolak", () => {
    for (const index of [2, 3]) {
        const parts = encryptMfaSecret(secret, 1).split(".");
        parts[index] =
            (parts[index][0] === "0" ? "1" : "0") + parts[index].slice(1);
        assert.throws(() => decryptMfaSecret(parts.join("."), 1));
    }
});

test("kunci berbeda gagal mendekripsi", () => {
    const encrypted = encryptMfaSecret(secret, 1);
    process.env.MFA_ENCRYPTION_KEY = randomBytes(32).toString("hex");
    assert.throws(() => decryptMfaSecret(encrypted, 1));
});

test("kunci hilang atau salah format tidak memakai fallback", () => {
    delete process.env.MFA_ENCRYPTION_KEY;
    assert.throws(() => assertMfaKeyConfigured(), /MFA_ENCRYPTION_KEY/);
    process.env.MFA_ENCRYPTION_KEY = "invalid";
    assert.throws(() => encryptMfaSecret(secret, 1), /MFA_ENCRYPTION_KEY/);
});

test("kode pemulihan unik, hash terikat akun, format penyalinan didukung", () => {
    const codes = createRecoveryCodes();
    assert.equal(codes.length, 10);
    assert.equal(new Set(codes).size, 10);
    for (const code of codes) {
        assert.match(code, /^[A-F0-9]{8}(?:-[A-F0-9]{8}){3}$/);
        const hash = recoveryCodeHash(code, 1);
        assert.match(hash!, /^[a-f0-9]{64}$/);
        assert.equal(
            recoveryCodeHash(code.toLowerCase().replace(/-/g, ""), 1),
            hash,
        );
        assert.notEqual(recoveryCodeHash(code, 2), hash);
    }
    assert.equal(recoveryCodeHash("invalid", 1), null);
});

test("setup menghasilkan URI Authenticator dengan parameter yang tepat", () => {
    const setup = createTotpSetup("admin@example.test");
    const uri = new URL(setup.uri);
    assert.match(setup.secret, /^[A-Z2-7]{32}$/);
    assert.equal(uri.protocol, "otpauth:");
    assert.equal(uri.hostname, "totp");
    assert.equal(uri.searchParams.get("issuer"), "MM ITBHAS");
    assert.equal(uri.searchParams.get("secret"), setup.secret);
    assert.equal(uri.searchParams.get("digits"), "6");
    assert.equal(uri.searchParams.get("period"), "30");
});
