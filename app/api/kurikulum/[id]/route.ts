import { validateTextFieldTypes } from "@/lib/http/text-fields";
import { parsePositiveInt32 } from "@/lib/http/positive-int32";
import { requireSameOriginRequest } from "@/lib/http/origin";
import { toKurikulumDto } from "@/lib/http/dto";
import { createAuditLog } from "@/lib/audit/log";
import {
    JENIS_MATA_KULIAH,
    KONSENTRASI_KURIKULUM,
} from "@/lib/kurikulum/constants";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { readJsonObjectBody } from "@/lib/http/json";
import { db } from "@/prisma/db";

const MAX_KURIKULUM_BODY_BYTES = 8 * 1024;
const MAX_KODE_LENGTH = 50;
const MAX_NAMA_LENGTH = 300;
const MAX_JENIS_LENGTH = 20;

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const kurikulumId = Number(id);

    if (!Number.isSafeInteger(kurikulumId) || kurikulumId <= 0) {
        return Response.json(
            { message: "ID kurikulum tidak valid" },
            { status: 400 }
        );
    }

    const item = await db.orm.public.Kurikulum
        .where({ id: kurikulumId })
        .first();

    if (!item) {
        return Response.json(
            { message: "Kurikulum tidak ditemukan" },
            { status: 404 }
        );
    }

    return Response.json(toKurikulumDto(item));
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const originError = requireSameOriginRequest(request);
    if (originError) {
        return originError;
    }

    const user = await requireAdminApi();

    if (!user) {
        return Response.json(
            { message: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        const { id } = await params;
        const kurikulumId = Number(id);

        if (!Number.isSafeInteger(kurikulumId) || kurikulumId <= 0) {
            return Response.json(
                { message: "ID kurikulum tidak valid" },
                { status: 400 }
            );
        }

        const bodyResult = await readJsonObjectBody(
            request,
            MAX_KURIKULUM_BODY_BYTES
        );

        if (!bodyResult.ok) {
            return bodyResult.response;
        }

        const body = bodyResult.body;

        const textTypeError = validateTextFieldTypes(body, [
            "kode",
            "nama",
            "jenis",
            "konsentrasi",
        ]);
        if (textTypeError) {
            return Response.json({ message: textTypeError }, { status: 400 });
        }

        const kode = String(body.kode ?? "").trim();
        const nama = String(body.nama ?? "").trim();
        const sks = parsePositiveInt32(body.sks);
        const semester = parsePositiveInt32(body.semester);
        const jenis = String(body.jenis ?? "").trim();
        const konsentrasi = String(body.konsentrasi ?? "").trim() || null;

        if (!kode || !nama || !jenis) {
            return Response.json(
                {
                    message:
                        "Kode, nama, SKS, semester, dan jenis wajib diisi",
                },
                { status: 400 }
            );
        }

        if (
            kode.length > MAX_KODE_LENGTH ||
            nama.length > MAX_NAMA_LENGTH ||
            jenis.length > MAX_JENIS_LENGTH
        ) {
            return Response.json(
                { message: "Salah satu field melebihi batas panjang" },
                { status: 400 }
            );
        }

        if (sks === null) {
            return Response.json(
                { message: "SKS harus berupa bilangan bulat positif" },
                { status: 400 }
            );
        }

        if (semester === null) {
            return Response.json(
                {
                    message:
                        "Semester harus berupa bilangan bulat positif",
                },
                { status: 400 }
            );
        }

        if (!JENIS_MATA_KULIAH.some((pilihan) => pilihan === jenis)) {
            return Response.json(
                {
                    message: "Jenis harus Wajib, Pilihan, atau Wajib Pilihan",
                },
                { status: 400 },
            );
        }

        if (
            konsentrasi !== null &&
            !KONSENTRASI_KURIKULUM.some(
                (pilihan) => pilihan === konsentrasi,
            )
        ) {
            return Response.json(
                { message: "Pilihan konsentrasi tidak valid" },
                { status: 400 },
            );
        }

        const item = await db.orm.public.Kurikulum
            .where({ id: kurikulumId })
            .first();

        if (!item) {
            return Response.json(
                { message: "Kurikulum tidak ditemukan" },
                { status: 404 }
            );
        }

        const duplicate = await db.orm.public.Kurikulum
            .where({ kode })
            .first();

        if (duplicate && duplicate.id !== kurikulumId) {
            return Response.json(
                {
                    message: `Kode ${kode} sudah terdaftar`,
                },
                { status: 400 }
            );
        }

        const updated = await db.transaction(async (tx) => {
            const mataKuliah =
                await tx.orm.public.Kurikulum
                    .where({ id: kurikulumId })
                    .update({
                        kode,
                        nama,
                        sks,
                        semester,
                        jenis,
                        ...(body.konsentrasi === undefined
                            ? {}
                            : { konsentrasi }),
                    });

            if (!mataKuliah) {
                throw new Error("Data tidak ditemukan saat update.");
            }

            await createAuditLog({
                userId: user.id,
                action: "UPDATE",
                entity: "Kurikulum",
                entityId: kurikulumId,
                details: `Mengubah mata kuliah dengan ID ${kurikulumId}`,
                dbClient: tx,
            });

            return mataKuliah;
        });

        return Response.json(toKurikulumDto(updated));
    } catch (error) {
        console.error("UPDATE KURIKULUM ERROR:", error);

        return Response.json(
            { message: "Gagal mengubah kurikulum" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const originError = requireSameOriginRequest(request);
    if (originError) {
        return originError;
    }

    const user = await requireAdminApi();

    if (!user) {
        return Response.json(
            { message: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        const { id } = await params;
        const kurikulumId = Number(id);

        if (!Number.isSafeInteger(kurikulumId) || kurikulumId <= 0) {
            return Response.json(
                { message: "ID kurikulum tidak valid" },
                { status: 400 }
            );
        }

        const item = await db.orm.public.Kurikulum
            .where({ id: kurikulumId })
            .first();

        if (!item) {
            return Response.json(
                { message: "Kurikulum tidak ditemukan" },
                { status: 404 }
            );
        }

        await db.transaction(async (tx) => {
            await tx.orm.public.Kurikulum
                .where({ id: kurikulumId })
                .delete();

            await createAuditLog({
                userId: user.id,
                action: "DELETE",
                entity: "Kurikulum",
                entityId: kurikulumId,
                details: `Menghapus mata kuliah ${item.kode} - ${item.nama}`,
                dbClient: tx,
            });
        });

        return Response.json({
            message: "Kurikulum berhasil dihapus",
        });
    } catch (error) {
        console.error("DELETE KURIKULUM ERROR:", error);

        return Response.json(
            { message: "Gagal menghapus kurikulum" },
            { status: 500 }
        );
    }
}