import "dotenv/config";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { db } from "../prisma/db";
import { hashPassword } from "../lib/auth/password";
import { hasSqlState } from "../lib/admin/accounts";
import {
    createBerita,
    updateBerita,
    deleteBerita,
    BeritaMutationError,
} from "../lib/berita/management";

const suffix = randomUUID();
const prefix = `uji-draft-berita-${suffix}`;
let userId: number | null = null;
let approved = false;
let passed = false;
let cleaned = false;

const complete = {
    title: `${prefix} berita lengkap`,
    date: "10 November 2026",
    description: "Deskripsi pengujian.",
    image: "/media/uji-utama.webp",
    thumbnail: "/media/uji-thumbnail.webp",
    content: "Isi berita pengujian.",
    status: "PUBLISHED",
};

const withoutStatusOrThumbnail = {
    title: complete.title,
    date: complete.date,
    description: complete.description,
    image: complete.image,
    content: complete.content,
};

function rejectsStatus(status: 400 | 404) {
    return (error: unknown) =>
        error instanceof BeritaMutationError && error.status === status;
}

async function auditCount() {
    if (userId === null) throw new Error("Akun uji belum tersedia.");

    const result = await db.orm.public.AuditLog
        .where({ userId, entity: "Berita" })
        .aggregate((a) => ({ total: a.count() }));

    return result.total;
}

async function fixtureCount() {
    const plan = db.raw.sql`
        SELECT count(*)::integer AS total
        FROM public."berita"
        WHERE title LIKE ${`${prefix}%`}::text
    `.returnsRow({ total: "pg/int4@1" }).build();

    const rows = await db.runtime().query(plan);
    return rows[0].total;
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

    const actor = await db.orm.public.AdminUser.create({
        nama: `Penguji draft ${suffix}`,
        email: `draft-${suffix}@example.invalid`,
        passwordHash: await hashPassword(randomBytes(32).toString("base64url")),
        role: "ADMIN",
        isActive: true,
    });
    userId = actor.id;

    const defaultProbe = await db.orm.public.Berita.create({
        title: `${prefix} default`,
        slug: `${prefix}-default`,
        date: "",
        description: "",
        image: "",
        content: "",
    });
    assert.equal(defaultProbe.status, "DRAFT");

    await assert.rejects(
        () => db.orm.public.Berita.create({
            title: `${prefix} status tidak valid`,
            slug: `${prefix}-invalid`,
            date: "",
            description: "",
            image: "",
            content: "",
            status: "INVALID",
        }),
        (error: unknown) => hasSqlState(error, "23514"),
    );

    const draft = await createBerita(actor.id, {
        title: `${prefix} judul saja`,
    });
    assert.equal(draft.status, "DRAFT");
    assert.equal(draft.content, "");
    assert.equal(await auditCount(), 1);

    await assert.rejects(
        () => updateBerita(actor.id, draft.slug, {
            title: draft.title,
            status: "PUBLISHED",
        }),
        rejectsStatus(400),
    );
    assert.equal(await auditCount(), 1);

    const stillDraft = await db.orm.public.Berita
        .where({ id: draft.id }).first();
    assert.equal(stillDraft?.status, "DRAFT");

    console.log("LULUS: default DRAFT, constraint status, draft minimal, dan penolakan penerbitan tidak lengkap.");

    const published = await updateBerita(actor.id, draft.slug, complete);
    assert.equal(published.status, "PUBLISHED");
    assert.equal(published.slug, draft.slug);
    assert.equal(published.thumbnail, complete.thumbnail);
    assert.equal(await auditCount(), 2);

    const preserved = await updateBerita(
        actor.id,
        draft.slug,
        withoutStatusOrThumbnail,
    );
    assert.equal(preserved.status, "PUBLISHED");
    assert.equal(preserved.thumbnail, complete.thumbnail);

    const cleared = await updateBerita(actor.id, draft.slug, {
        ...withoutStatusOrThumbnail,
        thumbnail: null,
    });
    assert.equal(cleared.thumbnail, null);

    await updateBerita(actor.id, draft.slug, complete);

    const changedImage = await updateBerita(actor.id, draft.slug, {
        ...withoutStatusOrThumbnail,
        image: "/media/uji-utama-baru.webp",
    });
    assert.equal(changedImage.status, "PUBLISHED");
    assert.equal(changedImage.thumbnail, null);
    assert.equal(await auditCount(), 6);

    const reverted = await updateBerita(actor.id, draft.slug, {
        ...withoutStatusOrThumbnail,
        status: "DRAFT",
    });
    assert.equal(reverted.status, "DRAFT");
    assert.equal(reverted.slug, draft.slug);
    assert.equal(await auditCount(), 7);

    console.log("LULUS: penerbitan, status lama, slug tetap, thumbnail, dan pengembalian ke draft.");

    assert.equal(
        await db.orm.public.AdminUser.where({ id: 0 }).first(),
        null,
    );

    await assert.rejects(
        () => createBerita(0, {
            title: `${prefix} tambah harus batal`,
        }),
        (error: unknown) => hasSqlState(error, "23503"),
    );
    assert.equal(await fixtureCount(), 2);

    const beforeFailure = await db.orm.public.Berita
        .where({ id: draft.id }).first();

    await assert.rejects(
        () => updateBerita(0, draft.slug, complete),
        (error: unknown) => hasSqlState(error, "23503"),
    );

    assert.deepEqual(
        await db.orm.public.Berita.where({ id: draft.id }).first(),
        beforeFailure,
    );

    await assert.rejects(
        () => deleteBerita(0, draft.slug),
        (error: unknown) => hasSqlState(error, "23503"),
    );

    assert.deepEqual(
        await db.orm.public.Berita.where({ id: draft.id }).first(),
        beforeFailure,
    );
    assert.equal(await auditCount(), 7);

    console.log("LULUS: kegagalan Audit Log membatalkan tambah, ubah, dan hapus.");

    await deleteBerita(actor.id, draft.slug);
    assert.equal(
        await db.orm.public.Berita.where({ id: draft.id }).first(),
        null,
    );

    await assert.rejects(
        () => deleteBerita(actor.id, draft.slug),
        rejectsStatus(404),
    );
    await assert.rejects(
        () => updateBerita(actor.id, draft.slug, complete),
        rejectsStatus(404),
    );

    const logs = await db.orm.public.AuditLog
        .where({ userId: actor.id, entity: "Berita" })
        .select("action", "entityId", "details")
        .all();

    assert.equal(logs.length, 8);
    assert.equal(logs.filter((log) => log.action === "CREATE").length, 1);
    assert.equal(logs.filter((log) => log.action === "UPDATE").length, 6);
    assert.equal(logs.filter((log) => log.action === "DELETE").length, 1);
    assert.ok(logs.every((log) => log.entityId === draft.id));
    assert.ok(logs.some((log) => log.details.includes("DRAFT → PUBLISHED")));
    assert.ok(logs.some((log) => log.details.includes("PUBLISHED → DRAFT")));

    console.log("LULUS: penghapusan, respons data hilang, dan riwayat perubahan status.");
    passed = true;
} catch (error) {
    process.exitCode = 1;
    console.error(
        "Pengujian transaksi gagal:",
        error instanceof assert.AssertionError
            ? error.message
            : error instanceof Error ? error.name : "UnknownError",
    );
} finally {
    try {
        if (approved) {
            await db.transaction(async (tx) => {
                const removeBerita = db.raw.sql`
                    DELETE FROM public."berita"
                    WHERE title LIKE ${`${prefix}%`}::text
                    RETURNING id
                `.returnsRow({ id: "pg/int4@1" }).build();
                await tx.query(removeBerita);

                if (userId !== null) {
                    const removeAudit = db.raw.sql`
                        DELETE FROM public."auditLog"
                        WHERE "userId" = ${userId}
                        RETURNING id
                    `.returnsRow({ id: "pg/int4@1" }).build();
                    await tx.query(removeAudit);

                    await tx.orm.public.AdminUser
                        .where({ id: userId }).delete();
                }
            });

            assert.equal(await fixtureCount(), 0);
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
    console.log("Semua uji transaksi draft berita lulus. Data dan akun uji telah dihapus.");
}
