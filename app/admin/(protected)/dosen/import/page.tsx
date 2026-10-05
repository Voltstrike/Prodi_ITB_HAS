"use client";

import { ChangeEvent, useState } from "react";
import * as XLSX from "xlsx";

type PreviewRow = {
    rowNumber: number;
    nama: string;
    nidn: string;
    pendidikanS1: string;
    pendidikanS2: string;
    pendidikanS3: string;
    slug: string;
    error?: string;
};

const REQUIRED_COLUMNS = ["nama", "nidn"];

function generateSlug(nama: string) {
    return nama
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export default function ImportDosenPage() {
    const [fileName, setFileName] = useState("");
    const [rows, setRows] = useState<PreviewRow[]>([]);
    const [error, setError] = useState("");
    const [checkingDatabase, setCheckingDatabase] = useState(false);
    const [importing, setImporting] = useState(false);
    const [success, setSuccess] = useState("");

    function handleDownloadTemplate() {
        const worksheet = XLSX.utils.aoa_to_sheet([
            [
                "nama",
                "nidn",
                "pendidikanS1",
                "pendidikanS2",
                "pendidikanS3",
            ],
            ["", "", "", "", ""],
        ]);

        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(workbook, worksheet, "Dosen");

        XLSX.writeFile(workbook, "template-import-dosen.xlsx");
    }

    async function handleFileChange(
        event: ChangeEvent<HTMLInputElement>,
    ) {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        setFileName(file.name);
        setRows([]);
        setError("");
        setSuccess("");
        setCheckingDatabase(false);

        if (!file.name.toLowerCase().endsWith(".xlsx")) {
            setError("File harus berformat .xlsx");
            return;
        }

        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const data = e.target?.result;

                if (!data) {
                    setError("File tidak dapat dibaca.");
                    return;
                }

                const workbook = XLSX.read(data, {
                    type: "array",
                });

                const firstSheet =
                    workbook.Sheets[workbook.SheetNames[0]];

                if (!firstSheet) {
                    setError("Excel tidak memiliki sheet.");
                    return;
                }

                const rawRows =
                    XLSX.utils.sheet_to_json<Record<string, unknown>>(
                        firstSheet,
                        {
                            defval: "",
                        },
                    );

                if (rawRows.length === 0) {
                    setError("Excel tidak memiliki data.");
                    return;
                }

                const columns = Object.keys(rawRows[0]).map((column) =>
                    column.trim().toLowerCase(),
                );

                const missingColumns = REQUIRED_COLUMNS.filter(
                    (column) => !columns.includes(column),
                );

                if (missingColumns.length > 0) {
                    setError(
                        `Kolom wajib tidak ditemukan: ${missingColumns.join(
                            ", ",
                        )}`,
                    );
                    return;
                }

                const preview = rawRows
                    .map<PreviewRow | null>((rawRow, index) => {
                        const normalizedRow: Record<string, string> = {};

                        Object.entries(rawRow).forEach(([key, value]) => {
                            normalizedRow[key.trim().toLowerCase()] =
                                String(value ?? "").trim();
                        });

                        const nama = normalizedRow.nama ?? "";
                        const nidn = normalizedRow.nidn ?? "";
                        const pendidikanS1 =
                            normalizedRow.pendidikans1 ?? "";
                        const pendidikanS2 =
                            normalizedRow.pendidikans2 ?? "";
                        const pendidikanS3 =
                            normalizedRow.pendidikans3 ?? "";

                        if (
                            !nama &&
                            !nidn &&
                            !pendidikanS1 &&
                            !pendidikanS2 &&
                            !pendidikanS3
                        ) {
                            return null;
                        }

                        const errors: string[] = [];

                        if (!nama) {
                            errors.push("Nama kosong");
                        }

                        if (!nidn) {
                            errors.push("NIDN kosong");
                        }

                        return {
                            rowNumber: index + 2,
                            nama,
                            nidn,
                            pendidikanS1,
                            pendidikanS2,
                            pendidikanS3,
                            slug: generateSlug(nama),
                            ...(errors.length > 0
                                ? {
                                      error: errors.join("; "),
                                  }
                                : {}),
                        };
                    })
                    .filter(
                        (row): row is PreviewRow => row !== null,
                    );

                if (preview.length === 0) {
                    setError("Tidak ada data yang dapat diimport.");
                    return;
                }

                const nidnCount = new Map<string, number>();

                preview.forEach((row) => {
                    if (!row.nidn) {
                        return;
                    }

                    nidnCount.set(
                        row.nidn,
                        (nidnCount.get(row.nidn) ?? 0) + 1,
                    );
                });

                preview.forEach((row) => {
                    const count = nidnCount.get(row.nidn) ?? 0;

                    if (count > 1) {
                        const duplicateMessage =
                            "Duplicate NIDN di Excel";

                        row.error = row.error
                            ? `${row.error}; ${duplicateMessage}`
                            : duplicateMessage;
                    }
                });

                setCheckingDatabase(true);

                const nidnList = preview
                    .map((row) => row.nidn)
                    .filter(Boolean);

                const response = await fetch(
                    "/api/dosen/import/check",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            nidnList,
                        }),
                    },
                );

                if (!response.ok) {
                    setCheckingDatabase(false);
                    setError(
                        "Gagal memeriksa NIDN di database.",
                    );
                    return;
                }

                const result = await response.json();

                const existingNidn = new Set<string>(
                    result.existingNidn ?? [],
                );

                preview.forEach((row) => {
                    if (existingNidn.has(row.nidn)) {
                        const databaseMessage =
                            "NIDN sudah terdaftar";

                        row.error = row.error
                            ? `${row.error}; ${databaseMessage}`
                            : databaseMessage;
                    }
                });

                setCheckingDatabase(false);
                setRows(preview);
            } catch {
                setCheckingDatabase(false);
                setError(
                    "Gagal membaca atau memeriksa file Excel.",
                );
            }
        };

        reader.readAsArrayBuffer(file);
    }

    async function handleImport() {
        const validRows = rows.filter((row) => !row.error);

        if (validRows.length === 0) {
            return;
        }

        setImporting(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch("/api/dosen/import", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    rows: validRows.map((row) => ({
                        nama: row.nama,
                        nidn: row.nidn,
                        pendidikanS1: row.pendidikanS1,
                        pendidikanS2: row.pendidikanS2,
                        pendidikanS3: row.pendidikanS3,
                    })),
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                setError(result.message ?? "Import gagal.");
                setImporting(false);
                return;
            }

            setSuccess(
                `Import berhasil. ${result.importedCount} data berhasil ditambahkan.`,
            );
            setImporting(false);
        } catch {
            setError(
                "Terjadi kesalahan saat melakukan import.",
            );
            setImporting(false);
        }
    }

    const validRows = rows.filter((row) => !row.error);

    const invalidRows = rows.filter((row) => row.error);

    const canImport =
        rows.length > 0 &&
        invalidRows.length === 0 &&
        !checkingDatabase &&
        !importing;

    return (
        <div className="space-y-8">
            <section>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Import Dosen
                        </h1>

                        <p className="mt-1 text-sm text-slate-600">
                            Tambahkan data dosen secara massal
                            menggunakan file Excel.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            window.location.href = "/admin/dosen";
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                        Kembali
                    </button>
                </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div>
                    <h2 className="font-semibold text-slate-900">
                        Upload File Excel
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Pilih file Excel untuk melihat dan memeriksa data
                        dosen sebelum diimport.
                    </p>
                </div>

                <div className="mt-6 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-6">
                    <div className="flex flex-col items-center justify-center text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="h-6 w-6 text-slate-500"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 16.5V3.75m0 0L7.5 8.25M12 3.75l4.5 4.5M4.5 15.75v1.5A2.25 2.25 0 0 0 6.75 19.5h10.5a2.25 2.25 0 0 0 2.25-2.25v-1.5"
                                />
                            </svg>
                        </div>

                        <p className="mt-4 text-sm font-medium text-slate-800">
                            Pilih file Excel
                            </p>

                        <p className="mt-1 text-xs text-slate-500">
                            Format .xlsx
                        </p>

                        <label className="mt-4 cursor-pointer rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-800">
                            Pilih File
                            <input
                                type="file"
                                accept=".xlsx"
                                onChange={handleFileChange}
                                disabled={importing}
                                className="hidden"
                            />
                        </label>
                    </div>
                </div>

                {fileName && (
                    <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                File terpilih
                            </p>

                            <p className="mt-1 truncate text-sm font-medium text-slate-800">
                                {fileName}
                            </p>
                        </div>

                        <label className="shrink-0 cursor-pointer text-sm font-medium text-blue-700 hover:text-blue-800">
                            Ganti file
                            <input
                                type="file"
                                accept=".xlsx"
                                onChange={handleFileChange}
                                disabled={importing}
                                className="hidden"
                            />
                        </label>
                    </div>
                )}

                <div className="mt-5 flex items-start gap-3 rounded-lg bg-blue-50 px-4 py-3">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="mt-0.5 h-5 w-5 shrink-0 text-blue-600"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v3.75m0 3h.008v.008H12v-.008ZM10.5 3.75h3l7.5 13.5H3l7.5-13.5Z"
                        />
                    </svg>

                    <div>
                        <p className="text-sm font-medium text-blue-800">
                            Format kolom
                        </p>

                        <p className="mt-1 text-xs leading-5 text-blue-700">
                            Kolom wajib: nama dan nidn. Kolom pendidikanS1,
                            pendidikanS2, dan pendidikanS3 bersifat opsional.
                        </p>
                    </div>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-5">
                    <button
                        type="button"
                        onClick={handleDownloadTemplate}
                        className="text-sm font-medium text-blue-700 hover:text-blue-800"
                    >
                        Download Template Excel →
                    </button>
                </div>
            </section>

            {checkingDatabase && (
                <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                    <p className="text-sm text-blue-700">
                        Memeriksa NIDN di database...
                    </p>
                </div>
            )}

            {error && (
                <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3">
                    <p className="text-sm text-red-700">
                        {error}
                    </p>
                </div>
            )}

            {success && (
                <div className="rounded-xl border border-green-100 bg-green-50 p-6">
                    <p className="font-medium text-green-800">
                        {success}
                    </p>

                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <button
                            type="button"
                            onClick={() => {
                                window.location.href =
                                    "/admin/dosen";
                            }}
                            className="rounded-lg bg-green-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-800"
                        >
                            Kembali ke Daftar Dosen
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                window.location.reload();
                            }}
                            className="rounded-lg border border-green-200 bg-white px-4 py-2.5 text-sm font-medium text-green-700 transition hover:bg-green-50"
                        >
                            Import File Lain
                        </button>
                    </div>
                </div>
            )}

            {rows.length > 0 && !success && (
                <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-6 py-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="font-semibold text-slate-900">
                                    Preview Data
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Periksa data sebelum melakukan
                                    import.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2 text-xs font-medium">
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                                    Total {rows.length}
                                </span>

                                <span className="rounded-full bg-green-50 px-3 py-1 text-green-700">
                                    Valid {validRows.length}
                                </span>

                                <span className="rounded-full bg-red-50 px-3 py-1 text-red-700">
                                    Tidak valid {invalidRows.length}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-[900px] w-full text-left text-sm">
                            <thead className="bg-slate-50 text-xs font-medium text-slate-500">
                                <tr>
                                    <th className="w-16 px-4 py-3 text-center">
                                        Baris
                                    </th>

                                    <th className="min-w-52 px-4 py-3">
                                        Nama
                                    </th>

                                    <th className="min-w-40 px-4 py-3">
                                        NIDN
                                    </th>

                                    <th className="min-w-40 px-4 py-3">
                                        Pendidikan S1
                                    </th>

                                    <th className="min-w-40 px-4 py-3">
                                        Pendidikan S2
                                    </th>

                                    <th className="min-w-40 px-4 py-3">
                                        Pendidikan S3
                                    </th>

                                    <th className="min-w-52 px-4 py-3">
                                        Status
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {rows.map((row) => (
                                    <tr
                                        key={row.rowNumber}
                                        className={
                                            row.error
                                                ? "bg-red-50/40"
                                                : "bg-white"
                                        }
                                    >
                                        <td className="px-4 py-4 text-center text-xs text-slate-400">
                                            {row.rowNumber}
                                        </td>

                                        <td className="px-4 py-4">
                                            <p className="font-medium text-slate-900">
                                                {row.nama || "-"}
                                            </p>
                                        </td>

                                        <td className="px-4 py-4 font-mono text-xs text-slate-600">
                                            {row.nidn || "-"}
                                        </td>

                                        <td className="px-4 py-4 text-slate-600">
                                            {row.pendidikanS1 || "-"}
                                        </td>

                                        <td className="px-4 py-4 text-slate-600">
                                            {row.pendidikanS2 || "-"}
                                        </td>

                                        <td className="px-4 py-4 text-slate-600">
                                            {row.pendidikanS3 || "-"}
                                        </td>

                                        <td className="px-4 py-4">
                                            {row.error ? (
                                                <div>
                                                    <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                                                        Tidak valid
                                                    </span>

                                                    <p className="mt-2 max-w-64 text-xs leading-5 text-red-600">
                                                        {row.error}
                                                    </p>
                                                </div>
                                            ) : (
                                                <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                                                    Valid
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-slate-500">
                            {invalidRows.length > 0
                                ? "Perbaiki data yang tidak valid sebelum import."
                                : "Semua data siap untuk diimport."}
                        </p>

                        <button
                            type="button"
                            onClick={handleImport}
                            disabled={!canImport}
                            className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {importing
                                ? "Mengimport..."
                                : `Import ${validRows.length} Data`}
                        </button>
                    </div>
                </section>
            )}
        </div>
    );
}