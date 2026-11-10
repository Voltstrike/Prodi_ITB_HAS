import "dotenv/config";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { db } from "../prisma/db";
import { hashPassword } from "../lib/auth/password";

const base = "http://localhost:3000";
const configuredOrigin = new URL(process.env.APP_ORIGIN ?? base);
const origin = configuredOrigin.origin;
const suffix = randomUUID();
const prefix = `uji-http-draft-${suffix}`;
const email = `berita-http-${suffix}@example.invalid`;
const password = randomBytes(32).toString("base64url");
const draftTitle = `${prefix} rahasia-draft`;
const publishedTitle = `${prefix} <script>beritaProbe()</script>`;

type HttpResult = {
    status: number;
    headers: Headers;
    text: string;
    json: unknown;
};

type HttpBerita = {
    id: number;
    slug: string;
    title: string;
    status: string;
    thumbnail: string | null;
};

let approved = false;
let userId: number | null = null;
let cookie = "";
let passed = false;
let cleaned = false;

async function readResponse(response: Response): Promise<HttpResult> {
    const text = await response.text();
    let json: unknown = null;
    try {
        json = JSON.parse(text);
    } catch {
        // Halaman HTML tidak memiliki respons JSON.
    }
    return { status: response.status, headers: response.headers, text, json };
}

async function request(
    path: string,
    method = "GET",
    body?: unknown,
    options: { authenticated?: boolean; origin?: string } = {},
) {
    const headers: Record<string, string> = {};

    if (cookie && options.authenticated !== false) headers.Cookie = cookie;
    if (method !== "GET") headers.Origin = options.origin ?? origin;
    if (body !== undefined) headers["Content-Type"] = "application/json";

    return readResponse(await fetch(`${base}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        redirect: "manual",
        cache: "no-store",
        signal: AbortSignal.timeout(30000),
    }));
}

function expectApi(result: HttpResult, expected: number) {
    assert.equal(result.status, expected);
    assert.match(result.headers.get("cache-control") ?? "", /no-store/i);
}

function asBerita(result: HttpResult): HttpBerita {
    assert.ok(result.json !== null && typeof result.json === "object");
    const body = result.json as HttpBerita;
    assert.ok(Number.isSafeInteger(body.id) && body.id > 0);
    assert.equal(typeof body.slug, "string");
    assert.ok(!Object.hasOwn(body, "thumbnaul"));
    assert.ok(Object.hasOwn(body, "thumbnail"));
    assert.ok(!Object.hasOwn(body, "passwordHash"));
    return body;
}

function visibleText(html: string) {
    return html
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ");
}

try {
    const target = new URL(process.env.DATABASE_URL ?? "");
    if (
        !["postgres:", "postgresql:"].includes(target.protocol) ||
        target.hostname !== "localhost" ||
        (target.port || "5432") !== "5432" ||
        target.pathname !== "/mm_itbhas"
    ) {
        throw new Error("Pengujian hanya untuk database lokal mm_itbhas.");
    }
    if (
        !["http:", "https:"].includes(configuredOrigin.protocol) ||
        configuredOrigin.pathname !== "/" ||
        configuredOrigin.username ||
        configuredOrigin.password ||
        configuredOrigin.search ||
        configuredOrigin.hash
    ) {
        throw new Error("APP_ORIGIN pengujian tidak valid.");
    }
    approved = true;

    const initialList = await request("/api/berita", "GET", undefined, {
        authenticated: false,
    });
    expectApi(initialList, 200);
    assert.ok(Array.isArray(initialList.json));
    const baseline = (initialList.json as HttpBerita[]).length;

    expectApi(
        await request("/api/admin/berita/tidak-ada", "GET", undefined, {
            authenticated: false,
        }),
        403,
    );

    for (const [path, method, body] of [
        ["/api/berita", "POST", { title: draftTitle }],
        ["/api/berita/tidak-ada", "PUT", { title: draftTitle }],
        ["/api/berita/tidak-ada", "DELETE", undefined],
    ] as const) {
        expectApi(await request(path, method, body, {
            authenticated: false,
        }), 401);
    }

    const deniedPage = await request(
        "/admin/berita",
        "GET",
        undefined,
        { authenticated: false },
    );
    assert.ok([307, 308].includes(deniedPage.status));
    assert.equal(
        new URL(deniedPage.headers.get("location") ?? "", base).pathname,
        "/admin/login",
    );

    console.log("LULUS: halaman dan API admin menolak akses tanpa login.");

    const actor = await db.orm.public.AdminUser.create({
        nama: `Penguji berita HTTP ${suffix}`,
        email,
        passwordHash: await hashPassword(password),
        role: "ADMIN",
        isActive: true,
    });
    userId = actor.id;

    if (configuredOrigin.protocol === "https:") {
        expectApi(await request("/api/auth/login", "POST", {
            email, password,
        }, { authenticated: false, origin: base }), 403);
    }

    const login = await request("/api/auth/login", "POST", {
        email, password,
    }, { authenticated: false });
    expectApi(login, 200);

    cookie = login.headers.getSetCookie()
        .map((value) => value.split(";")[0])
        .join("; ");
    assert.ok(cookie, "Login belum menghasilkan cookie sesi.");

    for (const [path, method, body] of [
        ["/api/berita", "POST", { title: draftTitle }],
        ["/api/berita/tidak-ada", "PUT", { title: draftTitle }],
        ["/api/berita/tidak-ada", "DELETE", undefined],
    ] as const) {
        expectApi(await request(path, method, body, {
            origin: "https://other-site.invalid",
        }), 403);
    }

    for (const body of [
        { title: draftTitle, id: 1 },
        { title: draftTitle, slug: "slug-dari-klien" },
        { title: draftTitle, status: "TERBIT" },
        { title: draftTitle, image: "javascript:alert(1)" },
        { title: draftTitle, status: "PUBLISHED" },
        [],
    ]) {
        expectApi(await request("/api/berita", "POST", body), 400);
    }

    expectApi(await request("/api/berita", "POST", {
        title: draftTitle,
        content: "x".repeat(270 * 1024),
    }), 413);

    const malformed = await readResponse(await fetch(`${base}/api/berita`, {
        method: "POST",
        headers: {
            Cookie: cookie,
            Origin: origin,
            "Content-Type": "application/json",
        },
        body: '{"title":',
        signal: AbortSignal.timeout(30000),
    }));
    expectApi(malformed, 400);

    console.log("LULUS: origin lain, field terlarang, status salah, JSON rusak, dan payload berlebih ditolak.");

    const create = await request("/api/berita", "POST", { title: draftTitle });
    expectApi(create, 201);
    const created = asBerita(create);
    assert.equal(created.status, "DRAFT");

    const encodedSlug = encodeURIComponent(created.slug);
    const apiPath = `/api/berita/${encodedSlug}`;
    const privatePath = `/api/admin/berita/${encodedSlug}`;
    const detailPath = `/berita/${encodedSlug}`;

    const privateDraft = await request(privatePath);
    expectApi(privateDraft, 200);
    assert.equal(asBerita(privateDraft).title, draftTitle);

    const editPage = await request(`/admin/berita/${encodedSlug}`);
    assert.equal(editPage.status, 200);
    assert.ok(editPage.text.includes(draftTitle));

    // Draft tambahan memastikan draft tidak memengaruhi jumlah berita publik.
    await db.transaction(async (tx) => {
        for (let index = 0; index < 10; index++) {
            await tx.orm.public.Berita.create({
                title: `${prefix} draft tambahan ${index}`,
                slug: `${prefix}-extra-${index}`,
                date: "",
                description: "",
                image: "",
                content: "",
                status: "DRAFT",
            });
        }
    });

    const publicList = await request("/api/berita?status=DRAFT", "GET", undefined, {
        authenticated: false,
    });
    expectApi(publicList, 200);
    assert.ok(Array.isArray(publicList.json));
    const publicRows = publicList.json as HttpBerita[];
    assert.equal(publicRows.length, baseline);
    assert.ok(publicRows.every((row) => row.status === "PUBLISHED"));
    assert.ok(publicRows.every((row) => !row.title.startsWith(prefix)));

    expectApi(await request(apiPath, "GET", undefined, {
        authenticated: false,
    }), 404);

    for (const path of ["/", "/berita", "/berita?page=999999"]) {
        const page = await request(path, "GET", undefined, {
            authenticated: false,
        });
        assert.equal(page.status, 200);
        assert.ok(!page.text.includes(prefix), `Draft bocor pada ${path}`);
        if (path === "/berita") {
            assert.match(
                visibleText(page.text),
                new RegExp(`\\b${baseline} berita\\b`),
            );
        }
    }

    const hiddenDetail = await request(detailPath, "GET", undefined, {
        authenticated: false,
    });
    assert.equal(hiddenDetail.status, 404);
    assert.ok(!hiddenDetail.text.includes(draftTitle));

    console.log("LULUS: draft hanya tersedia bagi admin; beranda, jumlah, daftar, pagination, API, dan detail publik terlindungi.");

    expectApi(await request(apiPath, "PUT", {
        title: draftTitle,
        status: "PUBLISHED",
    }), 400);

    const complete = {
        title: publishedTitle,
        date: "10 November 2026",
        description: `${prefix} deskripsi publik`,
        image: "/media/uji-berita-http.webp",
        thumbnail: null,
        content: `${prefix} isi berita.`,
        status: "PUBLISHED",
    };

    const publish = await request(apiPath, "PUT", complete);
    expectApi(publish, 200);
    assert.equal(asBerita(publish).status, "PUBLISHED");
    assert.equal(asBerita(publish).slug, created.slug);

    expectApi(await request(apiPath, "GET", undefined, {
        authenticated: false,
    }), 200);

    for (const path of ["/", "/berita", detailPath]) {
        const page = await request(path, "GET", undefined, {
            authenticated: false,
        });
        assert.equal(page.status, 200);
        assert.ok(page.text.includes("&lt;script&gt;beritaProbe()&lt;/script&gt;"));
        assert.ok(!page.text.includes("<script>beritaProbe()</script>"));
    }

    const revert = await request(apiPath, "PUT", {
        ...complete,
        status: "DRAFT",
    });
    expectApi(revert, 200);
    assert.equal(asBerita(revert).status, "DRAFT");

    expectApi(await request(apiPath, "GET", undefined, {
        authenticated: false,
    }), 404);

    for (const path of ["/", "/berita"]) {
        const page = await request(path, "GET", undefined, {
            authenticated: false,
        });
        assert.equal(page.status, 200);
        assert.ok(!page.text.includes(prefix));
    }

    assert.equal(
        (await request(detailPath, "GET", undefined, {
            authenticated: false,
        })).status,
        404,
    );
    expectApi(await request(privatePath), 200);

    console.log("LULUS: penerbitan, escape HTML, dan penyembunyian ulang tanpa membocorkan draft.");

    expectApi(await request(apiPath, "DELETE"), 200);
    expectApi(await request(privatePath), 404);
    expectApi(await request(apiPath, "DELETE"), 404);

    const audit = await db.orm.public.AuditLog
        .where({ userId: actor.id, entity: "Berita" })
        .aggregate((a) => ({ total: a.count() }));
    assert.equal(audit.total, 4);

    await db.orm.public.AdminUser
        .where({ id: actor.id })
        .update({ isActive: false });

    expectApi(await request(privatePath), 403);
    expectApi(await request("/api/berita", "POST", {
        title: draftTitle,
    }), 401);

    console.log("LULUS: hapus, Audit Log, dan penolakan akun nonaktif.");
    passed = true;
} catch (error) {
    process.exitCode = 1;
    console.error(
        "Pengujian HTTP berita gagal:",
        error instanceof Error ? error.message : "UnknownError",
    );
} finally {
    try {
        if (approved) {
            await db.transaction(async (tx) => {
                const berita = db.raw.sql`
                    DELETE FROM public."berita"
                    WHERE title LIKE ${`${prefix}%`}::text
                    RETURNING id
                `.returnsRow({ id: "pg/int4@1" }).build();
                await tx.query(berita);

                if (userId !== null) {
                    const audit = db.raw.sql`
                        DELETE FROM public."auditLog"
                        WHERE "userId" = ${userId}
                        RETURNING id
                    `.returnsRow({ id: "pg/int4@1" }).build();
                    await tx.query(audit);

                    await tx.orm.public.AdminUser
                        .where({ id: userId }).delete();
                }
            });
            cleaned = true;
        }
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
}

if (passed && cleaned && process.exitCode !== 1) {
    console.log("Semua uji HTTP draft berita lulus. Data, akun, sesi, dan audit uji telah dihapus.");
}
