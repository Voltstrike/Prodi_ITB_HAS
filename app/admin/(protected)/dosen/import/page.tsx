"use client";

import { ChangeEvent, useState } from "react";
import * as XLSX from "xlsx";

type PreviewRow = {
    rowNumber: number;
    nama: string;
    nidn: string;
    pendidikan: string;
    slug: string;
    error?: string;
};

const REQUIRED_COLUMNS = ["nama", "nidn", "pendidikan"];

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
        ["nama", "nidn", "pendidikan"],
        ["", "", ""],
    ]);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Dosen"
    );

    XLSX.writeFile(workbook, "template-import-dosen.xlsx");
}

    async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
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

                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

                if (!firstSheet) {
                    setError("Excel tidak memiliki sheet.");
                    return;
                }

                const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
                    firstSheet,
                    {
                        defval: "",
                    }
                );

                if (rawRows.length === 0) {
                    setError("Excel tidak memiliki data.");
                    return;
                }

                const columns = Object.keys(rawRows[0]).map((column) =>
                    column.trim().toLowerCase()
                );

                const missingColumns = REQUIRED_COLUMNS.filter(
                    (column) => !columns.includes(column)
                );

                if (missingColumns.length > 0) {
                    setError(
                        `Kolom wajib tidak ditemukan: ${missingColumns.join(", ")}`
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
                        const pendidikan = normalizedRow.pendidikan ?? "";

                        if (!nama && !nidn && !pendidikan) {
                            return null;
                        }

                        const errors: string[] = [];

                        if (!nama) {
                            errors.push("Nama kosong");
                        }

                        if (!nidn) {
                            errors.push("NIDN kosong");
                        }

                        if (!pendidikan) {
                            errors.push("Pendidikan kosong");
                        } else if (!["S1", "S2", "S3"].includes(pendidikan)) {
                            errors.push("Pendidikan harus S1, S2, atau S3");
                        }

                        return {
                            rowNumber: index + 2,
                            nama,
                            nidn,
                            pendidikan,
                            slug: generateSlug(nama),
                            ...(errors.length > 0
                                ? { error: errors.join("; ") }
                                : {}),
                        };
                    })
                    .filter(
                        (row): row is PreviewRow => row !== null
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
                        (nidnCount.get(row.nidn) ?? 0) + 1
                    );
                });

                preview.forEach((row) => {
                    const count = nidnCount.get(row.nidn) ?? 0;

                    if (count > 1) {
                        const duplicateMessage = "Duplicate NIDN di Excel";

                        row.error = row.error
                            ? `${row.error}; ${duplicateMessage}`
                            : duplicateMessage;
                    }
                });

                setCheckingDatabase(true);

                const nidnList = preview
                    .map((row) => row.nidn)
                    .filter(Boolean);

                const response = await fetch("/api/dosen/import/check", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        nidnList,
                    }),
                });

                if (!response.ok) {
                    setCheckingDatabase(false);
                    setError("Gagal memeriksa NIDN di database.");
                    return;
                }

                const result = await response.json();

                const existingNidn = new Set<string>(
                    result.existingNidn ?? []
                );

                preview.forEach((row) => {
                    if (existingNidn.has(row.nidn)) {
                        const databaseMessage = "NIDN sudah terdaftar";

                        row.error = row.error
                            ? `${row.error}; ${databaseMessage}`
                            : databaseMessage;
                    }
                });

                setCheckingDatabase(false);
                setRows(preview);
            } catch {
                setCheckingDatabase(false);
                setError("Gagal membaca atau memeriksa file Excel.");
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
                        pendidikan: row.pendidikan,
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
                `Import berhasil. ${result.importedCount} data berhasil ditambahkan.`
            );
            setImporting(false);
        } catch {
            setError("Terjadi kesalahan saat melakukan import.");
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
        <main>
            <h1>Import Dosen</h1>

            <button
                type="button"
                onClick={handleDownloadTemplate}
            >
                Download Template Excel
            </button>

            <p>
                Upload file Excel dengan kolom: nama, nidn, pendidikan.
            </p>

            <input
                type="file"
                accept=".xlsx"
                onChange={handleFileChange}
                disabled={importing}
            />

            {fileName && <p>File: {fileName}</p>}

            {checkingDatabase && <p>Memeriksa NIDN di database...</p>}

            {error && <p>{error}</p>}

            {success && <p>{success}</p>}

            {rows.length > 0 && (
                <>
                    <p>
                        Total: {rows.length} data | Valid: {validRows.length} |
                        Tidak valid: {invalidRows.length}
                    </p>

                    <button
                        type="button"
                        onClick={handleImport}
                        disabled={!canImport}
                    >
                        {importing ? "Mengimport..." : "Import Data"}
                    </button>

                    <table>
                        <thead>
                            <tr>
                                <th>Baris</th>
                                <th>Nama</th>
                                <th>NIDN</th>
                                <th>Pendidikan</th>
                                <th>Slug</th>
                                <th>Status</th>
                            </tr>
                        </thead>

                        <tbody>
                            {rows.map((row) => (
                                <tr key={row.rowNumber}>
                                    <td>{row.rowNumber}</td>
                                    <td>{row.nama}</td>
                                    <td>{row.nidn}</td>
                                    <td>{row.pendidikan}</td>
                                    <td>{row.slug}</td>
                                    <td>{row.error ?? "Valid"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}
        </main>
    );
}
