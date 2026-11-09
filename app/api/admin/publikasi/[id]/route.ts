import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { requireSameOriginRequest } from "@/lib/http/origin";
import { parsePositiveInt32 } from "@/lib/http/positive-int32";
import { getAdminPublicationById } from "@/lib/publikasi/queries";
import {
    deletePublication,
    updatePublication,
} from "@/lib/publikasi/management";
import {
    publicationErrorResponse,
    publicationJson,
    readPublicationInput,
} from "@/lib/publikasi/api";

export const dynamic = "force-dynamic";

type Context = {
    params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: Context) {
    const admin = await requireAdminApi();
    if (!admin) {
        return publicationJson({ message: "Akses ditolak." }, 403);
    }

    const id = parsePositiveInt32((await context.params).id);
    if (id === null) {
        return publicationJson({ message: "ID publikasi tidak valid." }, 400);
    }

    try {
        const publication = await getAdminPublicationById(id);

        if (!publication) {
            return publicationJson(
                { message: "Publikasi tidak ditemukan." },
                404,
            );
        }

        return publicationJson(publication);
    } catch (error) {
        return publicationErrorResponse(error);
    }
}

export async function PUT(request: Request, context: Context) {
    const originError = requireSameOriginRequest(request);
    if (originError) {
        originError.headers.set("Cache-Control", "private, no-store");
        return originError;
    }

    const admin = await requireAdminApi();
    if (!admin) {
        return publicationJson({ message: "Akses ditolak." }, 403);
    }

    const id = parsePositiveInt32((await context.params).id);
    if (id === null) {
        return publicationJson({ message: "ID publikasi tidak valid." }, 400);
    }

    try {
        const input = await readPublicationInput(request);
        if (!input.ok) return input.response;

        const publication = await updatePublication(
            admin.id,
            id,
            input.data,
        );

        return publicationJson(publication);
    } catch (error) {
        return publicationErrorResponse(error);
    }
}

export async function DELETE(request: Request, context: Context) {
    const originError = requireSameOriginRequest(request);
    if (originError) {
        originError.headers.set("Cache-Control", "private, no-store");
        return originError;
    }

    const admin = await requireAdminApi();
    if (!admin) {
        return publicationJson({ message: "Akses ditolak." }, 403);
    }

    const id = parsePositiveInt32((await context.params).id);
    if (id === null) {
        return publicationJson({ message: "ID publikasi tidak valid." }, 400);
    }

    try {
        await deletePublication(admin.id, id);
        return publicationJson({ message: "Publikasi berhasil dihapus." });
    } catch (error) {
        return publicationErrorResponse(error);
    }
}
