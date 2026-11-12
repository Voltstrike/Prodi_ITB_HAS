import Link from "next/link";
import { KONSENTRASI_KURIKULUM } from "@/lib/kurikulum/constants";

type MataKuliah = {
    id: number;
    kode: string;
    nama: string;
    sks: number;
    semester: number;
    jenis: string;
    konsentrasi: string | null;
};

type Props = {
    items: MataKuliah[];
    semester?: string | string[];
    konsentrasi?: string | string[];
};

export default function KurikulumSection({
    items,
    semester: semesterParam,
    konsentrasi: konsentrasiParam,
}: Props) {
    const semesters = [...new Set(items.map((item) => item.semester))]
        .sort((a, b) => a - b);

    const showAll = semesterParam === "semua";

    const semester = showAll ? undefined : (
        semesters.find((value) => String(value) === semesterParam)
        ?? semesters[0]
    );

    const konsentrasi = KONSENTRASI_KURIKULUM.find(
        (value) => value === konsentrasiParam,
    ) ?? "";

    const courses = items.filter((item) =>
        (showAll || semester === undefined || item.semester === semester) &&
        (!konsentrasi || item.konsentrasi === konsentrasi),
    ).sort((a, b) =>
        a.semester - b.semester || a.kode.localeCompare(b.kode, "id"),
    );

    const title = showAll || semester === undefined
        ? "Semua Semester"
        : `Semester ${semester}`;

    function semesterHref(value: number | "semua") {
        const params = new URLSearchParams({
            semester: String(value),
        });

        if (konsentrasi) {
            params.set("konsentrasi", konsentrasi);
        }

        return `/akademik?${params.toString()}#kurikulum`;
    }

    const tabClass = (active: boolean) =>
        "inline-flex min-h-11 items-center rounded-lg px-4 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 " +
        (active
            ? "bg-blue-700 text-white"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900");

    return (
        <section
            id="kurikulum"
            className="scroll-mt-24 bg-slate-50"
        >
            <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-2xl font-bold text-slate-900">
                        Kurikulum
                    </h2>

                    <Link
                        href="#dokumen-kurikulum"
                        className="text-sm font-semibold text-blue-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                    >
                        Lihat Dokumen Kurikulum
                    </Link>
                </div>

                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600">
                    Pilih semester untuk melihat mata kuliah, atau saring
                    berdasarkan kelompok dan konsentrasi.
                </p>

                <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <nav
                        aria-label="Pilih semester kurikulum"
                        className="flex flex-wrap gap-1 border-b border-slate-200 p-3 sm:px-4"
                    >
                        {semesters.map((value) => {
                            const active =
                                !showAll && semester === value;

                            return (
                                <Link
                                    key={value}
                                    href={semesterHref(value)}
                                    prefetch={false}
                                    aria-current={
                                        active ? "page" : undefined
                                    }
                                    className={tabClass(active)}
                                >
                                    Semester {value}
                                </Link>
                            );
                        })}

                        <Link
                            href={semesterHref("semua")}
                            prefetch={false}
                            aria-current={
                                showAll ? "page" : undefined
                            }
                            className={tabClass(showAll)}
                        >
                            Semua
                        </Link>
                    </nav>

                    <form
                        key={`${semester ?? "semua"}:${konsentrasi}`}
                        action="/akademik#kurikulum"
                        method="get"
                        className="flex flex-wrap items-end gap-3 border-b border-slate-200 bg-slate-50/60 px-4 py-4 sm:px-5"
                    >
                        <input
                            type="hidden"
                            name="semester"
                            value={
                                showAll ? "semua" : semester ?? ""
                            }
                        />

                        <label className="min-w-0 basis-full text-sm font-medium text-slate-700 sm:basis-auto">
                            Kelompok / Konsentrasi

                            <select
                                name="konsentrasi"
                                defaultValue={konsentrasi}
                                className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-700 sm:w-72"
                            >
                                <option value="">
                                    Semua Kelompok / Konsentrasi
                                </option>

                                {KONSENTRASI_KURIKULUM.map((value) => (
                                    <option key={value} value={value}>
                                        {value}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <button
                            type="submit"
                            className="min-h-11 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                        >
                            Terapkan
                        </button>

                        <Link
                            href="/akademik#kurikulum"
                            prefetch={false}
                            className="inline-flex min-h-11 items-center rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
                        >
                            Reset
                        </Link>
                    </form>

                    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-4 sm:px-5">
                        <h3 className="font-semibold text-slate-900">
                            {title}
                        </h3>

                        <p
                            role="status"
                            className="text-sm text-slate-500"
                        >
                            {courses.length} mata kuliah
                        </p>
                    </div>

                    {courses.length === 0 ? (
                        <div className="border-t border-slate-100 px-5 py-10 text-center">
                            <p className="text-sm text-slate-600">
                                Belum ada mata kuliah yang sesuai
                                dengan pilihan ini.
                            </p>

                            <p className="mt-2 text-xs text-slate-500">
                                Coba semester lain, pilih Semua,
                                atau reset filter.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="hidden overflow-x-auto md:block">
                                <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
                                    <caption className="sr-only">
                                        Daftar mata kuliah {title}
                                        {konsentrasi
                                            ? `, ${konsentrasi}`
                                            : ""}
                                    </caption>

                                    <thead className="border-y border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        <tr>
                                            {showAll && (
                                                <th
                                                    scope="col"
                                                    className="px-5 py-3"
                                                >
                                                    Semester
                                                </th>
                                            )}

                                            <th scope="col" className="px-5 py-3">
                                                Kode
                                            </th>
                                            <th scope="col" className="px-5 py-3">
                                                Mata Kuliah
                                            </th>
                                            <th scope="col" className="px-4 py-3 text-center">
                                                SKS
                                            </th>
                                            <th scope="col" className="px-5 py-3">
                                                Jenis
                                            </th>
                                            <th scope="col" className="px-5 py-3">
                                                Kelompok
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100">
                                        {courses.map((item) => (
                                            <tr
                                                key={item.id}
                                                className="align-top hover:bg-slate-50/70"
                                            >
                                                {showAll && (
                                                    <td className="px-5 py-4 text-slate-600">
                                                        {item.semester}
                                                    </td>
                                                )}

                                                <td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-slate-500">
                                                    {item.kode}
                                                </td>

                                                <th
                                                    scope="row"
                                                    className="px-5 py-4 font-medium text-slate-900 [overflow-wrap:anywhere]"
                                                >
                                                    {item.nama}
                                                </th>

                                                <td className="px-4 py-4 text-center tabular-nums text-slate-700">
                                                    {item.sks}
                                                </td>

                                                <td className="px-5 py-4 text-slate-600">
                                                    {item.jenis}
                                                </td>

                                                <td className="px-5 py-4 text-slate-600">
                                                    {item.konsentrasi || "—"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <ul
                                aria-label={`Daftar mata kuliah ${title}`}
                                className="divide-y divide-slate-100 border-t border-slate-100 md:hidden"
                            >
                                {courses.map((item) => (
                                    <li
                                        key={item.id}
                                        className="px-4 py-4"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold leading-relaxed text-slate-900 [overflow-wrap:anywhere]">
                                                    {item.nama}
                                                </p>

                                                <p className="mt-1 break-all font-mono text-xs text-slate-500">
                                                    {item.kode}
                                                </p>
                                            </div>

                                            <p className="shrink-0 pt-0.5 text-xs font-medium tabular-nums text-slate-600">
                                                {item.sks} SKS
                                            </p>
                                        </div>

                                        <p className="mt-2 text-xs leading-relaxed text-slate-500">
                                            {[
                                                showAll
                                                    ? `Semester ${item.semester}`
                                                    : "",
                                                item.jenis,
                                                item.konsentrasi,
                                            ]
                                                .filter(Boolean)
                                                .join(" · ")}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}
