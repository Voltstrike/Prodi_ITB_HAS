import { requireSameOriginRequest } from "@/lib/http/origin";
import { toProfilDto } from "@/lib/http/dto";
import { NextResponse } from "next/server";
import { db } from "@/prisma/db";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { createAuditLog } from "@/lib/audit/log";
import { readJsonObjectBody } from "@/lib/http/json";
import { validateTextFieldTypes } from "@/lib/http/text-fields";
import {
    validateOrganizationStructure,
    type OrganizationStructure,
} from "@/lib/organization/structure";
import {
    getOrganizationPeople,
    missingOrganizationPerson,
} from "@/lib/organization/people";
import { hasSqlState } from "@/lib/admin/accounts";

const MAX_PROFIL_BODY_BYTES = 256 * 1024;
const MAX_SEJARAH_LENGTH = 20_000;
const MAX_VISI_LENGTH = 10_000;
const MAX_MISI_LENGTH = 20_000;
const MAX_STRUKTUR_LENGTH = 50_000;
const MAX_AKREDITASI_LENGTH = 1_000;
const MAX_DOKUMEN_AKREDITASI_LENGTH = 2_048;

class ProfileMutationError extends Error {
    readonly status: number;

    constructor(status: number, message: string) {
        super(message);
        this.name = "ProfileMutationError";
        this.status = status;
    }
}

export async function GET() {
    const profil = (await db.orm.public.Profil
        .where({ singletonKey: 1 })
        .first()) ?? null;

    return NextResponse.json(profil ? toProfilDto(profil) : null, {
        headers: { "Cache-Control": "no-store" },
    });
}

export async function PUT(request: Request) {
    const originError = requireSameOriginRequest(request);
    if (originError) return originError;

    const admin = await requireAdminApi();

    if (!admin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const bodyResult = await readJsonObjectBody(
            request,
            MAX_PROFIL_BODY_BYTES,
        );
        if (!bodyResult.ok) return bodyResult.response;

        const body = bodyResult.body;
        const textTypeError = validateTextFieldTypes(body, [
            "sejarah", "visi", "misi", "struktur",
            "akreditasi", "dokumenAkreditasi",
        ]);

        if (textTypeError) {
            return NextResponse.json(
                { error: textTypeError },
                { status: 400 },
            );
        }

        const sejarah =
            typeof body.sejarah === "string" ? body.sejarah.trim() : "";
        const visi =
            typeof body.visi === "string" ? body.visi.trim() : "";
        const misi =
            typeof body.misi === "string" ? body.misi.trim() : "";
        const struktur =
            typeof body.struktur === "string" ? body.struktur.trim() : null;
        const akreditasi =
            typeof body.akreditasi === "string" ? body.akreditasi.trim() : null;
        const dokumenAkreditasi =
            typeof body.dokumenAkreditasi === "string"
                ? body.dokumenAkreditasi.trim()
                : null;

        if (!sejarah || !visi || !misi) {
            return NextResponse.json(
                { error: "Sejarah, visi, dan misi wajib diisi." },
                { status: 400 },
            );
        }

        if (
            sejarah.length > MAX_SEJARAH_LENGTH ||
            visi.length > MAX_VISI_LENGTH ||
            misi.length > MAX_MISI_LENGTH ||
            (struktur?.length ?? 0) > MAX_STRUKTUR_LENGTH ||
            (akreditasi?.length ?? 0) > MAX_AKREDITASI_LENGTH ||
            (dokumenAkreditasi?.length ?? 0) > MAX_DOKUMEN_AKREDITASI_LENGTH
        ) {
            return NextResponse.json(
                { error: "Salah satu field melebihi batas panjang." },
                { status: 400 },
            );
        }

        let organization: OrganizationStructure | undefined;

        if (Object.hasOwn(body, "strukturOrganisasi")) {
            const parsed = validateOrganizationStructure(
                body.strukturOrganisasi,
            );

            if (!parsed.ok) {
                return NextResponse.json(
                    { error: parsed.error },
                    { status: 400 },
                );
            }

            organization = parsed.value;

            if (!Object.hasOwn(body, "baseUpdatedAt")) {
                return NextResponse.json(
                    {
                        error:
                            "Versi profil diperlukan. Muat ulang halaman sebelum menyimpan bagan.",
                    },
                    { status: 400 },
                );
            }
        }

        const checkVersion = Object.hasOwn(body, "baseUpdatedAt");

        if (
            checkVersion &&
            body.baseUpdatedAt !== null &&
            (
                typeof body.baseUpdatedAt !== "string" ||
                body.baseUpdatedAt.length > 100 ||
                !Number.isFinite(Date.parse(body.baseUpdatedAt))
            )
        ) {
            return NextResponse.json(
                { error: "Versi profil tidak valid. Muat ulang halaman." },
                { status: 400 },
            );
        }

        const result = await db.transaction(async (tx) => {
            const lock = db.raw.sql`
                SELECT id FROM public."profil"
                WHERE "singletonKey" = 1
                FOR UPDATE
            `.returnsRow({ id: "pg/int4@1" }).build();

            await tx.query(lock);

            const existing = await tx.orm.public.Profil
                .where({ singletonKey: 1 })
                .first();

            if (
                checkVersion &&
                (existing?.updatedAt ?? null) !== body.baseUpdatedAt
            ) {
                throw new ProfileMutationError(
                    409,
                    "Profil telah berubah sejak halaman dibuka. Muat ulang halaman dan periksa perubahan sebelum menyimpan.",
                );
            }

            if (organization !== undefined) {
                const people = await getOrganizationPeople(
                    organization,
                    tx.orm.public,
                );
                const missing = missingOrganizationPerson(
                    organization,
                    people,
                );

                if (missing) {
                    throw new ProfileMutationError(400, missing);
                }
            }

            const data = {
                sejarah,
                visi,
                misi,
                ...(Object.hasOwn(body, "struktur") ? { struktur } : {}),
                akreditasi,
                dokumenAkreditasi,
                ...(organization !== undefined
                    ? { strukturOrganisasi: organization }
                    : {}),
            };

            if (!existing) {
                const profil = await tx.orm.public.Profil.create(data);

                await createAuditLog({
                    userId: admin.id,
                    action: "CREATE",
                    entity: "Profil",
                    entityId: profil.id,
                    details: "Membuat profil program studi.",
                    dbClient: tx,
                });

                return { profil, status: 201 };
            }

            const profil = await tx.orm.public.Profil
                .where({ id: existing.id })
                .update(data);

            if (!profil) {
                throw new Error("Data tidak ditemukan saat update.");
            }

            await createAuditLog({
                userId: admin.id,
                action: "UPDATE",
                entity: "Profil",
                entityId: existing.id,
                details: organization !== undefined
                    ? `Memperbarui profil program studi dan bagan organisasi (${organization.nodes.length} jabatan).`
                    : "Memperbarui profil program studi.",
                dbClient: tx,
            });

            return { profil, status: 200 };
        });

        return NextResponse.json(
            toProfilDto(result.profil),
            { status: result.status },
        );
    } catch (error) {
        if (error instanceof ProfileMutationError) {
            return NextResponse.json(
                { error: error.message },
                { status: error.status },
            );
        }

        if (hasSqlState(error, "23505")) {
            return NextResponse.json(
                {
                    error:
                        "Profil telah berubah. Muat ulang halaman sebelum menyimpan.",
                },
                { status: 409 },
            );
        }

        console.error(
            "PUT /api/profil error:",
            error instanceof Error ? error.name : "UnknownError",
        );

        return NextResponse.json(
            { error: "Gagal menyimpan profil." },
            { status: 500 },
        );
    }
}
