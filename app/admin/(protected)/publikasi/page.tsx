import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
    parsePublicationFilters,
    publicationHref,
} from "@/lib/publikasi/filters";
import { getAdminPublicationsPage } from "@/lib/publikasi/queries";
import { publicationMaxYear } from "@/lib/publikasi/validation";
import DeletePublicationButton from "./components/DeletePublicationButton";

export const dynamic = "force-dynamic";

export default async function PublicationsAdminPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    await requireAdmin();

    const values = await searchParams;
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(values)) {
        if (typeof value === "string") params.append(key, value);
        else if (Array.isArray(value)) {
            for (const item of value) params.append(key, item);
        }
    }

    const parsed = parsePublicationFilters(params, "admin");
    if (!parsed.ok) {
        return (
            <div className="space-y-4">
                <h1 className="text-2xl font-bold text-slate-900">
                    Publikasi Ilmiah
                </h1>
                <p role="alert" className="text-sm text-red-700">
                    Filter tidak valid. Periksa tahun, halaman, atau parameter pencarian.
                </p>
                <Link href="/admin/publikasi" className="text-blue-700 underline">
                    Reset filter
                </Link>
            </div>
        );
    }

    const filters = parsed.filters;
    const result = await getAdminPublicationsPage(filters);
    const { publications, total, page, totalPages } = result;

    const inputClass =
        "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900";
    const linkClass =
        "rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50";

    return (
        <div className="space-y-6">
            <header className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Publikasi Ilmiah
                    </h1>
                    <p className="mt-2 text-sm text-slate-600">
                        Kelola katalog tesis dan artikel yang sudah diterbitkan.
                    </p>
                </div>
                <Link
                    href="/admin/publikasi/tambah"
                    className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
                >
                    Tambah Publikasi
                </Link>
            </header>

            <form
                key={params.toString()}
                action="/admin/publikasi"
                method="get"
                className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2 xl:grid-cols-4"
            >
                <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                    Pencarian
                    <input
                        name="q"
                        defaultValue={filters.q}
                        maxLength={200}
                        placeholder="Judul, penulis, sumber, atau DOI"
                        className={inputClass}
                    />
                </label>

                <label className="text-sm font-medium text-slate-700">
                    Jenis
                    <select name="jenis" defaultValue={filters.jenis} className={inputClass}>
                        <option value="">Semua jenis</option>
                        <option value="TESIS">Tesis</option>
                        <option value="ARTIKEL">Artikel ilmiah</option>
                    </select>
                </label>

                <label className="text-sm font-medium text-slate-700">
                    Tahun
                    <input
                        name="tahun"
                        type="number"
                        min={1900}
                        max={publicationMaxYear()}
                        step={1}
                        defaultValue={filters.tahun ?? ""}
                        placeholder="Semua tahun"
                        className={inputClass}
                    />
                </label>

                <label className="text-sm font-medium text-slate-700">
                    Status website
                    <select name="status" defaultValue={filters.status} className={inputClass}>
                        <option value="SEMUA">Semua status</option>
                        <option value="TAMPIL">Ditampilkan</option>
                        <option value="TERSEMBUNYI">Tersembunyi</option>
                    </select>
                </label>

                <div className="flex items-end gap-4">
                    <button
                        type="submit"
                        className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
                    >
                        Terapkan
                    </button>
                    <Link href="/admin/publikasi" className="py-2 text-sm text-blue-700 hover:underline">
                        Reset
                    </Link>
                </div>
            </form>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-sm">
                    <caption className="sr-only">Daftar publikasi ilmiah</caption>
                    <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                        <tr>
                            <th scope="col" className="px-4 py-3">Publikasi</th>
                            <th scope="col" className="px-4 py-3">Penulis</th>
                            <th scope="col" className="px-4 py-3">Tahun</th>
                            <th scope="col" className="px-4 py-3">Status</th>
                            <th scope="col" className="px-4 py-3">Tindakan</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {publications.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                    Tidak ada publikasi yang sesuai.
                                </td>
                            </tr>
                        ) : publications.map((item) => (
                            <tr key={item.id} className="align-top">
                                <td className="min-w-64 max-w-xl break-words px-4 py-4">
                                    <Link
                                        href={`/admin/publikasi/${item.id}`}
                                        className="font-semibold text-blue-700 hover:underline"
                                    >
                                        {item.judul}
                                    </Link>
                                    <p className="mt-2 text-xs text-slate-500">
                                        {item.jenis === "TESIS" ? "Tesis" : "Artikel ilmiah"}
                                        {" · "}{item.sumber}
                                    </p>
                                    {item.doi && (
                                        <p className="mt-1 break-all text-xs text-slate-500">
                                            DOI: {item.doi}
                                        </p>
                                    )}
                                </td>
                                <td className="min-w-48 whitespace-pre-line break-words px-4 py-4 text-slate-600">
                                    {item.penulis}
                                </td>
                                <td className="px-4 py-4 text-slate-600">{item.tahun}</td>
                                <td className="px-4 py-4">
                                    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                                        item.ditampilkan
                                            ? "bg-emerald-50 text-emerald-800"
                                            : "bg-slate-100 text-slate-600"
                                    }`}>
                                        {item.ditampilkan ? "Ditampilkan" : "Tersembunyi"}
                                    </span>
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex flex-wrap items-start gap-2">
                                        <Link
                                            href={`/admin/publikasi/${item.id}`}
                                            aria-label={`Edit publikasi ${item.judul}`}
                                            className="rounded px-2 py-1 font-medium text-blue-700 hover:bg-blue-50"
                                        >
                                            Edit
                                        </Link>
                                        <DeletePublicationButton id={item.id} judul={item.judul} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <nav
                aria-label="Halaman daftar publikasi"
                className="flex flex-wrap items-center justify-between gap-4"
            >
                <p className="text-sm text-slate-500">
                    Menampilkan {publications.length} dari {total} publikasi.
                    {" "}Halaman {page} dari {totalPages}.
                </p>
                {totalPages > 1 && (
                    <div className="flex gap-3">
                        {page > 1 && (
                            <Link
                                href={publicationHref(filters, page - 1, "admin")}
                                className={linkClass}
                            >
                                Sebelumnya
                            </Link>
                        )}
                        {page < totalPages && (
                            <Link
                                href={publicationHref(filters, page + 1, "admin")}
                                className={linkClass}
                            >
                                Berikutnya
                            </Link>
                        )}
                    </div>
                )}
            </nav>
        </div>
    );
}
