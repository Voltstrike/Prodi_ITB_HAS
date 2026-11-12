import {
    listStoredImages,
    readLibraryFileInfo,
    type LibraryFileInfo,
} from "./library-files";
import {
    MEDIA_LIBRARY_PAGE_SIZE,
    type MediaLibraryFilters,
    type MediaLibraryType,
} from "./library-filters";

export type MediaLibraryItem = LibraryFileInfo & {
    jenis: MediaLibraryType;
    title: string;
    originalName: string;
};

export type MediaLibraryPage = {
    items: MediaLibraryItem[];
    total: number;
    page: number;
    totalPages: number;
    pageSize: number;
};

export type LibraryDocument = {
    filename: string;
    judul: string;
    namaAsli: string;
    ukuran: number;
};

type Sources = {
    imageDirectory: string;
    documentDirectory: string;
    loadDocuments: () => Promise<LibraryDocument[]>;
};

export async function collectMediaLibraryPage(
    filters: MediaLibraryFilters,
    sources: Sources,
): Promise<MediaLibraryPage> {
    const items: MediaLibraryItem[] = [];

    if (filters.jenis !== "DOKUMEN") {
        const images = await listStoredImages(
            sources.imageDirectory,
        );

        items.push(...images.map((image) => ({
            ...image,
            jenis: "GAMBAR" as const,
            title: image.filename,
            originalName: "",
        })));
    }

    if (filters.jenis !== "GAMBAR") {
        const documents = await sources.loadDocuments();
        let next = 0;
        const seen = new Set<string>();

        await Promise.all(Array.from({
            length: Math.min(8, documents.length),
        }, async () => {
            while (next < documents.length) {
                const document = documents[next++];

                if (seen.has(document.filename)) continue;
                seen.add(document.filename);

                const info = await readLibraryFileInfo(
                    sources.documentDirectory,
                    document.filename,
                    "DOKUMEN",
                );

                if (!info || info.size !== document.ukuran) {
                    continue;
                }

                items.push({
                    ...info,
                    jenis: "DOKUMEN",
                    title: document.judul,
                    originalName: document.namaAsli,
                });
            }
        }));
    }

    const query = filters.q.toLocaleLowerCase("id-ID");

    const filtered = items.filter((item) => [
        item.filename,
        item.title,
        item.originalName,
    ].some((value) =>
        value.toLocaleLowerCase("id-ID").includes(query),
    ));

    filtered.sort((a, b) =>
        Date.parse(b.modifiedAt) - Date.parse(a.modifiedAt) ||
        a.filename.localeCompare(b.filename, "en"),
    );

    const total = filtered.length;
    const totalPages = Math.max(
        1,
        Math.ceil(total / MEDIA_LIBRARY_PAGE_SIZE),
    );
    const page = Math.min(filters.page, totalPages);
    const offset = (page - 1) * MEDIA_LIBRARY_PAGE_SIZE;

    return {
        items: filtered.slice(
            offset,
            offset + MEDIA_LIBRARY_PAGE_SIZE,
        ),
        total,
        page,
        totalPages,
        pageSize: MEDIA_LIBRARY_PAGE_SIZE,
    };
}
