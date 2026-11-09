import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { getAuditLogsPage } from "@/lib/admin/audit-log-list";
import {
    auditLogDateTime,
    auditLogHref,
    parseAuditLogFilters,
    type AuditLogFilters,
} from "@/lib/admin/audit-log-filters";

export const dynamic = "force-dynamic";

const actionLabels: Readonly<Record<string, string>> = {
    CREATE: "Tambah",
    UPDATE: "Ubah",
    DELETE: "Hapus",
    IMPORT: "Impor",
};

const entityLabels: Readonly<Record<string, string>> = {
    Beranda: "Beranda",
    Profil: "Profil Prodi",
    Dosen: "Dosen",
    Staff: "Staff",
    Berita: "Berita",
    KegiatanProdi: "Kegiatan Prodi",
    PublikasiIlmiah: "Publikasi Ilmiah",
    Kurikulum: "Kurikulum",
    KalenderAkademik: "Kalender Akademik",
    InformasiAkademik: "Informasi Akademik",
    DokumenKurikulum: "Dokumen Akademik",
    DosenMataKuliah: "Penugasan Mengajar",
    AdminUser: "Akun Admin",
    AdminMfa: "MFA Admin",
};

type FormValues = Pick<
    AuditLogFilters,
    "q" | "actor" | "action" | "entity" | "from" | "to"
>;

const inputClass =
    "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700";

const linkClass =
    "rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700";

function labelFor(
    labels: Readonly<Record<string, string>>,
    value: string,
): string {
    return Object.hasOwn(labels, value) ? (labels[value] ?? value) : value;
}

function optionsFor(
    labels: Readonly<Record<string, string>>,
    current: string,
): [string, string][] {
    const options = Object.entries(labels);
    if (current && !Object.hasOwn(labels, current)) {
        options.push([current, current]);
    }
    return options;
}

function actionClass(action: string): string {
    switch (action) {
        case "CREATE":
            return "bg-emerald-50 text-emerald-800 ring-emerald-200";
        case "UPDATE":
            return "bg-blue-50 text-blue-800 ring-blue-200";
        case "DELETE":
            return "bg-red-50 text-red-800 ring-red-200";
        default:
            return "bg-slate-100 text-slate-700 ring-slate-200";
    }
}

function AuditFilterForm({ values }: { values: FormValues }) {
    return (
        <form
            action="/admin/audit-log"
            method="get"
            className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6"
        >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div>
                    <label htmlFor="audit-q" className="text-sm font-medium text-slate-700">
                        Cari aktivitas
                    </label>
                    <input
                        id="audit-q" name="q" type="search" maxLength={200}
                        defaultValue={values.q}
                        placeholder="Detail, objek, atau ID objek"
                        className={inputClass}
                    />
                </div>
                <div>
                    <label htmlFor="audit-actor" className="text-sm font-medium text-slate-700">
                        Admin
                    </label>
                    <input
                        id="audit-actor" name="actor" type="search" maxLength={100}
                        defaultValue={values.actor}
                        placeholder="Nama atau email admin"
                        className={inputClass}
                    />
                </div>
                <div>
                    <label htmlFor="audit-action" className="text-sm font-medium text-slate-700">
                        Tindakan
                    </label>
                    <select
                        id="audit-action" name="action"
                        defaultValue={values.action} className={inputClass}
                    >
                        <option value="">Semua tindakan</option>
                        {optionsFor(actionLabels, values.action).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="audit-entity" className="text-sm font-medium text-slate-700">
                        Objek
                    </label>
                    <select
                        id="audit-entity" name="entity"
                        defaultValue={values.entity} className={inputClass}
                    >
                        <option value="">Semua objek</option>
                        {optionsFor(entityLabels, values.entity).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="audit-from" className="text-sm font-medium text-slate-700">
                        Dari tanggal
                    </label>
                    <input
                        id="audit-from" name="from" type="date"
                        min="0001-01-01" max="9998-12-31"
                        defaultValue={values.from} className={inputClass}
                    />
                </div>
                <div>
                    <label htmlFor="audit-to" className="text-sm font-medium text-slate-700">
                        Sampai tanggal
                    </label>
                    <input
                        id="audit-to" name="to" type="date"
                        min="0001-01-01" max="9998-12-31"
                        defaultValue={values.to} className={inputClass}
                    />
                </div>
            </div>

            <p className="mt-3 text-xs text-slate-500">
                Rentang tanggal dan waktu mengikuti WIB.
                Klik tindakan atau objek pada tabel untuk memfilter.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
                <button
                    type="submit"
                    className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                >
                    Terapkan filter
                </button>
                <Link href="/admin/audit-log" prefetch={false} className={linkClass}>
                    Reset filter
                </Link>
            </div>
        </form>
    );
}

export default async function AuditLogPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    await requireSuperAdmin();

    const query = await searchParams;
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(query)) {
        if (Array.isArray(value)) {
            for (const item of value) params.append(key, item);
        } else if (value !== undefined) {
            params.append(key, value);
        }
    }

    const parsed = parseAuditLogFilters(params);
    const filters = parsed.ok ? parsed.filters : null;
    const values: FormValues = filters ?? {
        q: (params.get("q") ?? "").slice(0, 200),
        actor: (params.get("actor") ?? "").slice(0, 100),
        action: (params.get("action") ?? "").slice(0, 40),
        entity: (params.get("entity") ?? "").slice(0, 64),
        from: (params.get("from") ?? "").slice(0, 10),
        to: (params.get("to") ?? "").slice(0, 10),
    };
    const data = filters ? await getAuditLogsPage(filters) : null;

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-slate-900">Audit Log</h1>
                <p className="mt-1 text-sm text-slate-600">
                    Telusuri aktivitas administrasi yang dicatat aplikasi.
                </p>
            </header>

            <AuditFilterForm key={JSON.stringify(values)} values={values} />

            {!parsed.ok && (
                <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    {parsed.message}
                </p>
            )}

            {filters && data && (
                <>
                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                        <table className="min-w-[54rem] w-full text-left text-sm">
                            <caption className="sr-only">
                                Riwayat aktivitas admin, diurutkan dari yang terbaru.
                            </caption>
                            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                                <tr>
                                    {["Waktu (WIB)", "Admin", "Tindakan", "Objek", "Detail"].map((heading) => (
                                        <th key={heading} scope="col" className="px-4 py-3 font-semibold">
                                            {heading}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                                            Tidak ada catatan audit yang cocok dengan filter.
                                        </td>
                                    </tr>
                                ) : data.logs.map((log) => (
                                    <tr key={log.id} className="align-top hover:bg-slate-50/60">
                                        <td className="px-4 py-4">
                                            <time dateTime={log.createdAt} className="block whitespace-nowrap text-slate-700">
                                                {auditLogDateTime(log.createdAt)}
                                            </time>
                                            <span className="mt-1 block text-xs text-slate-400">
                                                Catatan #{log.id}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <p className="font-medium text-slate-900">{log.actorName}</p>
                                            <p className="mt-1 break-all text-xs text-slate-500">{log.actorEmail}</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <Link
                                                href={auditLogHref({ ...filters, action: log.action }, 1)}
                                                prefetch={false}
                                                aria-label={`Filter tindakan ${labelFor(actionLabels, log.action)}`}
                                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${actionClass(log.action)}`}
                                            >
                                                {labelFor(actionLabels, log.action)}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-4">
                                            <Link
                                                href={auditLogHref({ ...filters, entity: log.entity }, 1)}
                                                prefetch={false}
                                                className="font-medium text-blue-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                                            >
                                                {labelFor(entityLabels, log.entity)}
                                            </Link>
                                            <p className="mt-1 text-xs text-slate-500">ID objek: {log.entityId}</p>
                                        </td>
                                        <td className="min-w-64 max-w-lg px-4 py-4 text-slate-600">
                                            <p className="whitespace-pre-wrap break-words">
                                                {log.details.length > 160
                                                    ? `${log.details.slice(0, 160)}…`
                                                    : log.details || "Tidak ada keterangan tambahan."}
                                            </p>
                                            {log.details.length > 160 && (
                                                <details className="mt-2">
                                                    <summary className="w-fit cursor-pointer text-xs font-medium text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">
                                                        Baca detail lengkap
                                                    </summary>
                                                    <p className="mt-2 whitespace-pre-wrap break-words">{log.details}</p>
                                                </details>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <p className="text-xs text-slate-500 sm:hidden">
                        Geser tabel ke samping untuk melihat seluruh kolom.
                    </p>

                    <nav
                        aria-label="Navigasi halaman audit log"
                        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                        <p className="text-sm text-slate-500">
                            Menampilkan {data.logs.length} dari {data.total} catatan.
                            {" "}Halaman {data.page} dari {data.totalPages}.
                        </p>

                        {data.totalPages > 1 && (
                            <div className="flex gap-2">
                                {data.page > 1 ? (
                                    <Link href={auditLogHref(filters, data.page - 1)} prefetch={false} className={linkClass}>
                                        Sebelumnya
                                    </Link>
                                ) : (
                                    <span aria-disabled="true" className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-400">
                                        Sebelumnya
                                    </span>
                                )}

                                {data.page < data.totalPages ? (
                                    <Link href={auditLogHref(filters, data.page + 1)} prefetch={false} className={linkClass}>
                                        Berikutnya
                                    </Link>
                                ) : (
                                    <span aria-disabled="true" className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-400">
                                        Berikutnya
                                    </span>
                                )}
                            </div>
                        )}
                    </nav>
                </>
            )}
        </div>
    );
}
