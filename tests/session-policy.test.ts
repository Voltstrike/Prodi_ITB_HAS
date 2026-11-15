import assert from "node:assert/strict";
import test from "node:test";
import {
    getSessionDeadlines,
    isSessionExpired,
    type SessionTimestamps,
} from "../lib/auth/session-policy";

const start = Date.parse(
    "2026-11-14T08:00:00.000Z",
);
const minute = 60 * 1000;
const iso = (offset: number) =>
    new Date(start + offset * minute).toISOString();

const session: SessionTimestamps = {
    createdAt: iso(0),
    lastActivityAt: iso(0),
    expiresAt: iso(480),
};

test("idle tepat 30 menit ditolak, satu milidetik sebelumnya masih aktif", () => {
    assert.equal(
        isSessionExpired(session, start + 30 * minute - 1),
        false,
    );
    assert.equal(
        isSessionExpired(session, start + 30 * minute),
        true,
    );
    assert.equal(
        isSessionExpired(session, start + 31 * minute),
        true,
    );
});

test("aktivitas baru menggeser batas idle tanpa melewati maksimum 8 jam", () => {
    const active = {
        ...session,
        lastActivityAt: iso(20),
    };

    assert.equal(
        getSessionDeadlines(active)?.expiresAt,
        start + 50 * minute,
    );
    assert.equal(
        isSessionExpired(active, start + 49 * minute),
        false,
    );
    assert.equal(
        isSessionExpired(active, start + 50 * minute),
        true,
    );

    const nearLimit = {
        ...session,
        lastActivityAt: iso(475),
    };

    assert.equal(
        getSessionDeadlines(nearLimit)?.expiresAt,
        start + 480 * minute,
    );
    assert.equal(
        isSessionExpired(nearLimit, start + 480 * minute),
        true,
    );
});

test("batas tersimpan yang lebih pendek tetap berlaku setelah rotasi MFA", () => {
    const rotated = {
        createdAt: iso(470),
        lastActivityAt: iso(470),
        expiresAt: iso(480),
    };

    assert.equal(
        getSessionDeadlines(rotated)?.expiresAt,
        start + 480 * minute,
    );
    assert.equal(
        isSessionExpired(rotated, start + 480 * minute),
        true,
    );
});

test("expiry tersimpan lebih panjang tetap dibatasi delapan jam", () => {
    const tooLong = {
        ...session,
        lastActivityAt: iso(475),
        expiresAt: iso(600),
    };

    assert.equal(
        getSessionDeadlines(tooLong)?.absoluteExpiresAt,
        start + 480 * minute,
    );
    assert.equal(
        isSessionExpired(tooLong, start + 480 * minute),
        true,
    );
});

test("timestamp rusak dan urutan waktu tidak valid ditolak", () => {
    for (const invalid of [
        { ...session, createdAt: "invalid" },
        { ...session, expiresAt: "" },
        { ...session, lastActivityAt: "invalid" },
        { ...session, lastActivityAt: iso(-1) },
        { ...session, expiresAt: iso(0) },
    ]) {
        assert.equal(
            getSessionDeadlines(invalid),
            null,
        );
        assert.equal(
            isSessionExpired(invalid, start),
            true,
        );
    }

    assert.equal(
        isSessionExpired(session, Number.NaN),
        true,
    );
});

test("offset zona waktu dibandingkan sebagai waktu yang sama", () => {
    const offset = {
        createdAt: "2026-11-14T15:00:00+07:00",
        lastActivityAt: "2026-11-14T15:00:00+07:00",
        expiresAt: "2026-11-14T23:00:00+07:00",
    };

    assert.deepEqual(
        getSessionDeadlines(offset),
        getSessionDeadlines(session),
    );
});
