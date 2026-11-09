import "dotenv/config";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { db } from "../prisma/db";
import { hashPassword } from "../lib/auth/password";
import { publicationMaxYear } from "../lib/publikasi/validation";

const base = "http://localhost:3000";
const suffix = randomUUID();
const prefix = `uji-http-publikasi-${suffix}`;
const password = randomBytes(32).toString("base64url");
const email = `publikasi-http-${suffix}@example.invalid`;
const hiddenTitle = `${prefix} karya tersembunyi`;
const unsafeTitle = `${prefix} <script>publicationProbe()</script>`;

const input = {
    judul: hiddenTitle,
    jenis: "ARTIKEL",
    penulis: "Penulis Uji, S.E., M.M.\nPenulis Kedua",
    tahun: publicationMaxYear() - 1,
    sumber: "Jurnal Pengujian Lokal",
    ringkasan: "Ringkasan pengujian HTTP.",
    tautanPublikasi: `https://example.invalid/${suffix}`,
    doi: `10.99999/${suffix}`,
    ditampilkan: false,
};

type HttpPublication = {
    id: number;
    slug: string;
    judul: string;
    ditampilkan: boolean;
};

let userId: number | null = null;
let approved = false;
let passed = false;
let cleaned = false;
let cookie = "";

async function api(
    path: string,
    method = "GET",
    body?: unknown,
    options: { authenticated?: boolean; origin?: string } = {},
) {
    const headers: Record<string, string> = {};
    if (options.authenticated !== false && cookie) {
        headers.Cookie = cookie;
    }
    if (method !== "GET") {
        headers.Origin = options.origin ?? base;
    }
    if (body !== undefined) {
        headers["Content-Type"] = "application/json";
    }

    return fetch(`${base}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        redirect: "manual",
        cache: "no-store",
    });
}

function noStore(response: Response) {
    assert.match(
        response.headers.get("cache-control") ?? "",
        /no-store/i,
        "Respons API harus melarang penyimpanan cache.",
    );
}

async function publicPage(path: string) {
    return fetch(`${base}${path}`, {
        redirect: "manual",
        cache: "no-store",
    });
}

try {
    const target = new URL(process.env.DATABASE_URL ?? "");
    if (
        !["postgres:", "postgresql:"].includes(target.protocol) ||
        target.hostname !== "localhost" ||
        (target.port || "5432") !== "5432" ||
        target.pathname !== "/mm_itbhas"
    ) {
        throw new Error("Pengujian hanya boleh pada database lokal mm_itbhas.");
    }
    approved = true;

    const ready = await publicPage("/publikasi");
    assert.equal(ready.status, 200, "Jalankan npm run dev di localhost:3000.");

    for (const [path, method, body] of [
        ["/api/admin/publikasi", "GET", undefined],
        ["/api/admin/publikasi/1", "GET", undefined],
        ["/api/admin/publikasi", "POST", input],
        ["/api/admin/publikasi/1", "PUT", input],
        ["/api/admin/publikasi/1", "DELETE", undefined],
    ] as const) {
        const response = await api(path, method, body, {
            authenticated: false,
        });
        assert.equal(response.status, 403, `${method} harus membutuhkan login.`);
        noStore(response);
        await response.text();
    }

    console.log("LULUS: seluruh API publikasi admin menolak akses tanpa login.");

    const actor = await db.orm.public.AdminUser.create({
        nama: `Penguji HTTP ${suffix}`,
        email,
        passwordHash: await hashPassword(password),
        role: "ADMIN",
        isActive: true,
    });
    userId = actor.id;

    const login = await api("/api/auth/login", "POST", {
        email,
        password,
    }, { authenticated: false });

    assert.equal(login.status, 200, "Login akun uji gagal.");
    cookie = login.headers.getSetCookie()
        .map((value) => value.split(";")[0])
        .join("; ");
    assert.ok(cookie.length > 0, "Cookie sesi akun uji belum diterbitkan.");
    await login.text();

    for (const [path, method, body] of [
        ["/api/admin/publikasi", "POST", input],
        ["/api/admin/publikasi/1", "PUT", input],
        ["/api/admin/publikasi/1", "DELETE", undefined],
    ] as const) {
        const response = await api(path, method, body, {
            origin: "https://example.invalid",
        });
        assert.equal(response.status, 403, "Origin situs lain harus ditolak.");
        noStore(response);
        await response.text();
    }

    console.log("LULUS: permintaan perubahan dari origin lain ditolak.");

    const invalidBodies: unknown[] = [
        { ...input, id: 123 },
        { ...input, slug: "slug-dari-klien" },
        { ...input, ditampilkan: "false" },
        { ...input, tautanPublikasi: "javascript:alert(1)" },
        [],
    ];

    for (const body of invalidBodies) {
        const response = await api("/api/admin/publikasi", "POST", body);
        assert.equal(response.status, 400, "Payload tidak valid harus ditolak.");
        noStore(response);
        await response.text();
    }

    const malformed = await fetch(`${base}/api/admin/publikasi`, {
        method: "POST",
        headers: {
            Cookie: cookie,
            Origin: base,
            "Content-Type": "application/json",
        },
        body: '{"judul":',
    });
    assert.equal(malformed.status, 400);
    noStore(malformed);
    await malformed.text();

    const invalidFilters = await api("/api/admin/publikasi?page=0");
    assert.equal(invalidFilters.status, 400);
    noStore(invalidFilters);
    await invalidFilters.text();

    console.log("LULUS: field terlarang, tipe salah, URL berbahaya, JSON rusak, dan filter ditolak.");

    const create = await api("/api/admin/publikasi", "POST", input);
    assert.equal(create.status, 201);
    noStore(create);

    const created = await create.json() as HttpPublication;
    assert.ok(Number.isSafeInteger(created.id) && created.id > 0);
    assert.equal(typeof created.slug, "string");
    assert.equal(created.ditampilkan, false);

    const privateDetail = await api(`/api/admin/publikasi/${created.id}`);
    assert.equal(privateDetail.status, 200);
    noStore(privateDetail);
    const privateBody = await privateDetail.json() as HttpPublication;
    assert.equal(privateBody.id, created.id);

    const hiddenList = await publicPage(
        `/publikasi?q=${encodeURIComponent(prefix)}&status=SEMUA`,
    );
    assert.equal(hiddenList.status, 200);
    assert.ok(!(await hiddenList.text()).includes(hiddenTitle));

    const detailPath = `/publikasi/${encodeURIComponent(created.slug)}`;
    const hiddenDetail = await publicPage(detailPath);
    assert.equal(hiddenDetail.status, 404, "Detail tersembunyi harus 404.");
    await hiddenDetail.text();

    console.log("LULUS: admin dapat membuat entri tersembunyi; daftar dan detail publik tidak membocorkannya.");

    const duplicate = await api("/api/admin/publikasi", "POST", {
        ...input,
        judul: `${prefix} duplikat DOI`,
    });
    assert.equal(duplicate.status, 409);
    noStore(duplicate);
    await duplicate.text();

    const show = await api(`/api/admin/publikasi/${created.id}`, "PUT", {
        ...input,
        judul: unsafeTitle,
        ditampilkan: true,
    });
    assert.equal(show.status, 200);
    noStore(show);
    const shown = await show.json() as HttpPublication;
    assert.equal(shown.slug, created.slug);
    assert.equal(shown.ditampilkan, true);

    const visibleList = await publicPage(
        `/publikasi?q=${encodeURIComponent(prefix)}`,
    );
    assert.equal(visibleList.status, 200);
    const listHtml = await visibleList.text();
    assert.ok(listHtml.includes("&lt;script&gt;publicationProbe()&lt;/script&gt;"));
    assert.ok(!listHtml.includes("<script>publicationProbe()</script>"));

    const visibleDetail = await publicPage(detailPath);
    assert.equal(visibleDetail.status, 200);
    const detailHtml = await visibleDetail.text();
    assert.ok(detailHtml.includes("&lt;script&gt;publicationProbe()&lt;/script&gt;"));
    assert.ok(!detailHtml.includes("<script>publicationProbe()</script>"));
    assert.ok(detailHtml.includes(input.tautanPublikasi));

    console.log("LULUS: konflik DOI menghasilkan 409; publikasi tampil dan judul di-escape sebagai teks.");

    const hide = await api(`/api/admin/publikasi/${created.id}`, "PUT", input);
    assert.equal(hide.status, 200);
    await hide.text();

    const hiddenAgain = await publicPage(detailPath);
    assert.equal(hiddenAgain.status, 404);
    await hiddenAgain.text();

    const remove = await api(`/api/admin/publikasi/${created.id}`, "DELETE");
    assert.equal(remove.status, 200);
    noStore(remove);
    await remove.text();

    const missing = await api(`/api/admin/publikasi/${created.id}`);
    assert.equal(missing.status, 404);
    noStore(missing);
    await missing.text();

    const repeatedDelete = await api(`/api/admin/publikasi/${created.id}`, "DELETE");
    assert.equal(repeatedDelete.status, 404);
    await repeatedDelete.text();

    const audit = await db.orm.public.AuditLog
        .where({ userId: actor.id, entity: "PublikasiIlmiah" })
        .aggregate((a) => ({ total: a.count() }));
    assert.equal(audit.total, 4, "Hanya perubahan yang berhasil boleh tercatat.");

    await db.orm.public.AdminUser
        .where({ id: actor.id })
        .update({ isActive: false });

    const inactive = await api("/api/admin/publikasi");
    assert.equal(inactive.status, 403);
    noStore(inactive);
    await inactive.text();

    console.log("LULUS: sembunyikan ulang, hapus, Audit Log, dan penolakan akun nonaktif.");
    passed = true;
} catch (error) {
    process.exitCode = 1;
    console.error(
        "Pengujian HTTP gagal:",
        error instanceof Error ? error.message : "UnknownError",
    );
} finally {
    try {
        if (approved) {
            await db.transaction(async (tx) => {
                const publications = db.raw.sql`
                    DELETE FROM public."publikasiIlmiah"
                    WHERE judul LIKE ${`${prefix}%`}::text
                    RETURNING id
                `.returnsRow({ id: "pg/int4@1" }).build();
                await tx.query(publications);

                if (userId !== null) {
                    const audit = db.raw.sql`
                        DELETE FROM public."auditLog"
                        WHERE "userId" = ${userId}
                        RETURNING id
                    `.returnsRow({ id: "pg/int4@1" }).build();
                    await tx.query(audit);

                    await tx.orm.public.AdminUser
                        .where({ id: userId })
                        .delete();
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
    console.log("Semua uji HTTP publikasi lulus. Akun, sesi, publikasi, dan audit uji telah dihapus.");
}
