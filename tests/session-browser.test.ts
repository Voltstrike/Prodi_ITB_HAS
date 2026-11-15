import assert from "node:assert/strict";
import test from "node:test";
import { SessionBrowser, type BrowserSession, type SessionView } from "../lib/auth/session-browser";

const minute = 60_000;
const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

function fixture() {
    let now = Date.parse("2026-11-15T00:00:00Z");
    let idleExpiresAt = now + 30 * minute;
    const absoluteExpiresAt = now + 8 * 60 * minute;
    let expired = 0;
    let changed = 0;
    const calls: (number | undefined)[] = [];
    const views: SessionView[] = [];
    const snapshot = (): BrowserSession => ({
        sessionId: 10, serverNow: now, absoluteExpiresAt, idleExpiresAt,
        expiresAt: Math.min(absoluteExpiresAt, idleExpiresAt),
    });
    let handler = async (id?: number): Promise<Response> => {
        if (now >= Math.min(idleExpiresAt, absoluteExpiresAt)) return new Response(null, { status: 401 });
        if (id !== undefined) idleExpiresAt = now + 30 * minute;
        return Response.json(snapshot());
    };
    const tracker = new SessionBrowser(snapshot(), {
        now: () => now,
        request: (id) => { calls.push(id); return handler(id); },
        render: (view) => views.push(view),
        expired: () => { expired++; },
        changed: () => { changed++; },
    });
    return {
        tracker, calls, views, snapshot,
        advance: (ms: number) => { now += ms; },
        extend: () => { idleExpiresAt = now + 30 * minute; },
        respond: (fn: typeof handler) => { handler = fn; },
        expired: () => expired,
        changed: () => changed,
    };
}

test("mount, polling, dan pengecekan focus tidak mengirim aktivitas", async () => {
    const f = fixture();
    f.tracker.check(); await flush();
    for (let i = 0; i < 4; i++) {
        f.advance(30_000); f.tracker.tick(); await flush();
        f.tracker.check(); await flush();
    }
    assert.ok(f.calls.length > 1);
    assert.ok(f.calls.every((id) => id === undefined));
});

test("aktivitas dicatat dan dibatasi sekali per 30 detik", async () => {
    const f = fixture();
    f.tracker.check(); await flush();
    f.tracker.activity(); await flush();
    for (let i = 0; i < 29; i++) {
        f.advance(1000); f.tracker.activity(); await flush();
    }
    assert.equal(f.calls.filter((id) => id !== undefined).length, 1);
    f.advance(1000); f.tracker.tick(); await flush();
    f.tracker.tick(); await flush();
    assert.equal(f.calls.filter((id) => id !== undefined).length, 2);
});

test("peringatan muncul dua menit sebelum batas idle", async () => {
    const f = fixture();
    f.advance(28 * minute); f.tracker.tick(); await flush();
    assert.equal(f.views.at(-1)?.seconds, 120);
    assert.equal(f.expired(), 0);
});

test("setelah sleep, sesi habis diperiksa tanpa POST atau dihidupkan kembali", async () => {
    const f = fixture();
    f.tracker.check(); await flush();
    f.advance(35 * minute); f.tracker.activity(); await flush();
    assert.equal(f.expired(), 1);
    assert.ok(f.calls.every((id) => id === undefined));
    f.tracker.tick(); f.tracker.activity(); await flush();
    assert.equal(f.expired(), 1);
});

test("aktivitas tab lain memperpanjang sesi tanpa logout dari timer lama", async () => {
    const f = fixture();
    f.tracker.check(); await flush();
    f.advance(29 * minute); f.extend();
    f.advance(2 * minute); f.tracker.tick(); await flush();
    assert.equal(f.expired(), 0);
    assert.equal(f.views.at(-1)?.seconds, null);
    assert.ok(f.calls.every((id) => id === undefined));
});

test("gangguan koneksi tidak menganggap sesi habis atau membuat aktivitas otomatis", async () => {
    const f = fixture();
    f.respond(async () => { throw new Error("offline"); });
    f.tracker.activity(); await flush();
    assert.equal(f.views.at(-1)?.unavailable, true);
    assert.equal(f.expired(), 0);
    f.respond(async () => Response.json(f.snapshot()));
    f.advance(5000); f.tracker.tick(); await flush();
    f.tracker.tick(); await flush();
    assert.equal(f.views.at(-1)?.unavailable, false);
    assert.ok(f.calls.every((id) => id === undefined));
});

test("identitas sesi baru memicu refresh tanpa menyentuh atau mencabut sesi itu", async () => {
    const f = fixture();
    f.respond(async () => Response.json({ ...f.snapshot(), sessionId: 11 }));
    f.tracker.check(); await flush();
    f.tracker.activity(); f.tracker.tick(); await flush();
    assert.equal(f.changed(), 1);
    assert.equal(f.expired(), 0);
    assert.deepEqual(f.calls, [undefined]);
});

test("POST dengan cookie lama diperiksa kembali sebelum mengalihkan ke login", async () => {
    const f = fixture();
    f.tracker.check(); await flush();
    f.respond(async (id) => id === undefined
        ? Response.json({ ...f.snapshot(), sessionId: 11 })
        : new Response(null, { status: 401 }));
    f.tracker.activity(); await flush();
    assert.equal(f.expired(), 0);
    f.tracker.tick(); await flush();
    assert.equal(f.changed(), 1);
    assert.equal(f.expired(), 0);
});

test("aktivitas tertunda sebelum sleep dibuang", async () => {
    const f = fixture();
    f.tracker.check(); await flush();
    f.tracker.activity(); await flush();
    f.advance(1000); f.tracker.activity();
    f.advance(60_000); f.tracker.tick(); await flush();
    f.tracker.tick(); await flush();
    assert.equal(f.calls.filter((id) => id !== undefined).length, 1);
});

test("respons rusak tidak dipercaya sebagai perpanjangan sesi", async () => {
    const f = fixture();
    f.respond(async () => Response.json({ ...f.snapshot(), expiresAt: "besok" }));
    f.tracker.check(); await flush();
    assert.equal(f.views.at(-1)?.unavailable, true);
    assert.equal(f.expired(), 0);
});

test("respons lama setelah komponen dilepas diabaikan", async () => {
    const f = fixture();
    let finish!: (response: Response) => void;
    f.respond(() => new Promise((resolve) => { finish = resolve; }));
    f.tracker.check();
    const count = f.views.length;
    f.tracker.dispose();
    finish(new Response(null, { status: 401 })); await flush();
    assert.equal(f.expired(), 0);
    assert.equal(f.views.length, count);
});

test("jam perangkat mundur tetap memicu pemeriksaan server", async () => {
    const f = fixture();
    f.tracker.check(); await flush();
    f.advance(-60 * minute); f.tracker.tick(); await flush();
    assert.equal(f.calls.length, 2);
    assert.ok(f.calls.every((id) => id === undefined));
    assert.equal(f.expired(), 0);
});

test("aktivitas terus-menerus tidak melewati batas absolut delapan jam", async () => {
    const f = fixture();
    f.tracker.check(); await flush();
    for (let i = 0; i < 32; i++) {
        f.advance(15 * minute);
        f.tracker.activity(); await flush();
        f.tracker.tick(); await flush();
    }
    assert.equal(f.expired(), 1);
    assert.equal(f.calls.at(-1), undefined);
});
