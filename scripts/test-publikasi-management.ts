import "dotenv/config";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { db } from "../prisma/db";
import { hashPassword } from "../lib/auth/password";
import { hasSqlState } from "../lib/admin/accounts";
import {
    createPublication,
    updatePublication,
    deletePublication,
    PublicationNotFoundError,
} from "../lib/publikasi/management";
import { getAdminPublicationById } from "../lib/publikasi/queries";
import {
    validatePublikasiInput,
    publicationMaxYear,
    type PublikasiInput,
} from "../lib/publikasi/validation";

const suffix = randomUUID();
const prefix = `uji-publikasi-management-${suffix}`;
const doi = `10.99999/${suffix}`;
let userId: number | null = null;
let approved = false;
let passed = false;
let cleaned = false;

function input(overrides: Partial<PublikasiInput> = {}): PublikasiInput {
    const result = validatePublikasiInput({
        judul: `${prefix} pertama`,
        jenis: "ARTIKEL",
        penulis: "Penulis Uji, S.E., M.M.\nPenulis Kedua",
        tahun: publicationMaxYear() - 1,
        sumber: "Sumber pengujian lokal",
        ringkasan: null,
        tautanPublikasi: `https://example.invalid/${suffix}`,
        doi,
        ditampilkan: false,
        ...overrides,
    });

    if (!result.ok) throw new Error(result.message);
    return result.data;
}

async function fixtureCount() {
    const plan = db.raw.sql`
        SELECT count(*)::integer AS total
        FROM public."publikasiIlmiah"
        WHERE judul LIKE ${`${prefix}%`}::text
    `.returnsRow({ total: "pg/int4@1" }).build();

    const rows = await db.runtime().query(plan);
    return rows[0].total;
}

async function auditCount() {
    assert.notEqual(userId, null);
    const result = await db.orm.public.AuditLog
        .where({ userId: userId!, entity: "PublikasiIlmiah" })
        .aggregate((a) => ({ total: a.count() }));
    return result.total;
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
        nama: `Penguji publikasi ${suffix}`,
        email: `publikasi-${suffix}@example.invalid`,
        passwordHash: await hashPassword(randomBytes(32).toString("base64url")),
        role: "ADMIN",
        isActive: true,
    });
    userId = actor.id;

    const first = await createPublication(actor.id, input());

    assert.equal(first.ditampilkan, false);
    assert.equal(first.doi, doi);
    assert.equal(await auditCount(), 1);
    assert.equal(await fixtureCount(), 1);

    const updated = await updatePublication(actor.id, first.id, input({
        judul: `${prefix} judul diubah`,
        ringkasan: "Ringkasan pengujian.",
        ditampilkan: true,
    }));

    assert.equal(updated.judul, `${prefix} judul diubah`);
    assert.equal(updated.ditampilkan, true);
    assert.equal(updated.slug, first.slug);
    assert.equal(await auditCount(), 2);

    console.log("LULUS: tambah, ubah, status tampil, slug tetap, dan Audit Log.");

    await assert.rejects(
        () => createPublication(actor.id, input({
            judul: `${prefix} DOI duplikat`,
        })),
        (error: unknown) => hasSqlState(error, "23505"),
    );

    assert.equal(await fixtureCount(), 1);
    assert.equal(await auditCount(), 2);

    const second = await createPublication(actor.id, input({
        judul: `${prefix} kedua`,
        doi: null,
    }));

    await assert.rejects(
        () => updatePublication(actor.id, second.id, input({
            judul: `${prefix} perubahan yang harus batal`,
            ditampilkan: true,
        })),
        (error: unknown) => hasSqlState(error, "23505"),
    );

    const secondAfterConflict = await getAdminPublicationById(second.id);
    assert.ok(secondAfterConflict);
    assert.equal(secondAfterConflict.judul, `${prefix} kedua`);
    assert.equal(secondAfterConflict.doi, null);
    assert.equal(secondAfterConflict.ditampilkan, false);
    assert.equal(await auditCount(), 3);

    console.log("LULUS: DOI duplikat ditolak tanpa perubahan data atau audit tambahan.");

    const missingActor = await db.orm.public.AdminUser
        .where({ id: 0 })
        .select("id")
        .first();
    assert.equal(missingActor, null);

    await assert.rejects(
        () => createPublication(0, input({
            judul: `${prefix} transaksi tambah harus batal`,
            doi: null,
        })),
        (error: unknown) => hasSqlState(error, "23503"),
    );

    assert.equal(await fixtureCount(), 2);

    await assert.rejects(
        () => updatePublication(0, first.id, input({
            judul: `${prefix} transaksi ubah harus batal`,
            ditampilkan: false,
        })),
        (error: unknown) => hasSqlState(error, "23503"),
    );

    const firstAfterRollback = await getAdminPublicationById(first.id);
    assert.ok(firstAfterRollback);
    assert.equal(firstAfterRollback.judul, updated.judul);
    assert.equal(firstAfterRollback.ditampilkan, true);

    await assert.rejects(
        () => deletePublication(0, first.id),
        (error: unknown) => hasSqlState(error, "23503"),
    );

    assert.ok(await getAdminPublicationById(first.id));
    assert.equal(await auditCount(), 3);

    console.log("LULUS: kegagalan Audit Log membatalkan tambah, ubah, dan hapus.");

    await deletePublication(actor.id, first.id);
    assert.equal(await getAdminPublicationById(first.id), null);
    assert.equal(await auditCount(), 4);

    await assert.rejects(
        () => deletePublication(actor.id, first.id),
        PublicationNotFoundError,
    );

    await assert.rejects(
        () => updatePublication(actor.id, first.id, input()),
        PublicationNotFoundError,
    );

    assert.equal(await auditCount(), 4);

    const logs = await db.orm.public.AuditLog
        .where({ userId: actor.id, entity: "PublikasiIlmiah" })
        .select("action", "entityId")
        .all();

    assert.equal(
        logs.filter((log) => log.action === "CREATE").length,
        2,
    );
    assert.equal(
        logs.filter((log) => log.action === "UPDATE").length,
        1,
    );
    assert.equal(
        logs.filter((log) => log.action === "DELETE").length,
        1,
    );
    assert.ok(logs.every(
        (log) => log.entityId === first.id || log.entityId === second.id,
    ));

    console.log("LULUS: hapus, penanganan data hilang, dan identitas objek audit.");
    passed = true;
} catch (error) {
    process.exitCode = 1;
    console.error(
        "Pengujian gagal:",
        error instanceof Error ? error.name : "UnknownError",
    );
} finally {
    try {
        if (approved) {
            await db.transaction(async (tx) => {
                const removePublications = db.raw.sql`
                    DELETE FROM public."publikasiIlmiah"
                    WHERE judul LIKE ${`${prefix}%`}::text
                    RETURNING id
                `.returnsRow({ id: "pg/int4@1" }).build();

                await tx.query(removePublications);

                if (userId !== null) {
                    const removeAudit = db.raw.sql`
                        DELETE FROM public."auditLog"
                        WHERE "userId" = ${userId}
                        RETURNING id
                    `.returnsRow({ id: "pg/int4@1" }).build();

                    await tx.query(removeAudit);
                    await tx.orm.public.AdminUser.where({ id: userId }).delete();
                }
            });
            cleaned = true;
        }
    } catch (error) {
        process.exitCode = 1;
        console.error("Pembersihan gagal. ID akun uji:", userId);
        console.error(
            error instanceof Error ? error.name : "UnknownError",
        );
    }

    try {
        await db.close();
    } catch {
        process.exitCode = 1;
        console.error("Koneksi pengujian gagal ditutup.");
    }
}

if (passed && cleaned && process.exitCode !== 1) {
    console.log("Semua uji transaksi publikasi lulus. Data dan akun uji telah dihapus.");
}
