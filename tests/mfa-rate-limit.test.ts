import assert from "node:assert/strict";
import { test } from "node:test";
import { getMfaRateLimit } from "../lib/auth/mfa-verification";

const start = Date.parse("2026-11-07T00:00:00.000Z");
const firstFailedAt = new Date(start).toISOString();

test("percobaan kelima diblokir selama sisa jendela 15 menit", () => {
    assert.equal(
        getMfaRateLimit({ failedAttempts: 4, firstFailedAt }, start).allowed,
        true,
    );
    assert.deepEqual(
        getMfaRateLimit({ failedAttempts: 5, firstFailedAt }, start + 1000),
        { allowed: false, retryAfterSeconds: 899 },
    );
});

test("batas berakhir tepat setelah 15 menit", () => {
    assert.equal(
        getMfaRateLimit({ failedAttempts: 5, firstFailedAt }, start + 899999).allowed,
        false,
    );
    assert.deepEqual(
        getMfaRateLimit({ failedAttempts: 5, firstFailedAt }, start + 900000),
        { allowed: true, retryAfterSeconds: 0 },
    );
});

test("jam mundur tidak menghilangkan blokir", () => {
    assert.deepEqual(
        getMfaRateLimit({ failedAttempts: 5, firstFailedAt }, start - 60000),
        { allowed: false, retryAfterSeconds: 900 },
    );
});

test("keadaan pembatasan yang rusak ditolak", () => {
    assert.throws(() =>
        getMfaRateLimit({ failedAttempts: 5, firstFailedAt: null }, start));
    assert.throws(() =>
        getMfaRateLimit({ failedAttempts: 5, firstFailedAt: "invalid" }, start));
    assert.throws(() =>
        getMfaRateLimit({ failedAttempts: -1, firstFailedAt }, start));
});
