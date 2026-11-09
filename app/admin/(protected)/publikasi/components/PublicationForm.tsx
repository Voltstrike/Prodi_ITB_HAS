"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { PublicationRow } from "@/lib/publikasi/queries";
import { validatePublikasiInput } from "@/lib/publikasi/validation";

type TextField =
    | "judul"
    | "penulis"
    | "sumber"
    | "tautanPublikasi"
    | "doi"
    | "ringkasan";

const fields: {
    name: TextField;
    label: string;
    help?: string;
    required: boolean;
    maxLength: number;
    rows?: number;
    type?: "url";
}[] = [
    {
        name: "judul",
        label: "Judul publikasi",
        required: true,
        maxLength: 300,
    },
    {
        name: "penulis",
        label: "Penulis",
        help: "Satu nama per baris, sesuai urutan penulis pada publikasi. Gelar boleh dicantumkan.",
        required: true,
        maxLength: 4200,
        rows: 4,
    },
    {
        name: "sumber",
        label: "Jurnal atau repositori",
        help: "Nama jurnal, repositori kampus, atau sumber tempat karya diterbitkan.",
        required: true,
        maxLength: 300,
    },
    {
        name: "tautanPublikasi",
        label: "Tautan publikasi asli",
        help: "Gunakan halaman karya di jurnal atau repositori asal.",
        required: true,
        maxLength: 2048,
        type: "url",
    },
    {
        name: "doi",
        label: "DOI (opsional)",
        help: "Boleh berupa identifier DOI atau tautan https://doi.org/…",
        required: false,
        maxLength: 1024,
    },
    {
        name: "ringkasan",
        label: "Ringkasan (opsional)",
        required: false,
        maxLength: 10000,
        rows: 7,
    },
];

export default function PublicationForm({
    initial,
    maxYear,
}: {
    initial?: PublicationRow;
    maxYear: number;
}) {
    const router = useRouter();
    const [pending, setPending] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({
        judul: initial?.judul ?? "",
        jenis: initial?.jenis ?? "TESIS",
        penulis: initial?.penulis ?? "",
        tahun: String(initial?.tahun ?? maxYear - 1),
        sumber: initial?.sumber ?? "",
        tautanPublikasi: initial?.tautanPublikasi ?? "",
        doi: initial?.doi ?? "",
        ringkasan: initial?.ringkasan ?? "",
        ditampilkan: initial?.ditampilkan ?? false,
    });

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (pending) return;

        setError("");
        const validation = validatePublikasiInput(form, maxYear);

        if (!validation.ok) {
            setError(validation.message);
            return;
        }

        setPending(true);

        try {
            const response = await fetch(
                initial
                    ? `/api/admin/publikasi/${initial.id}`
                    : "/api/admin/publikasi",
                {
                    method: initial ? "PUT" : "POST",
                    credentials: "same-origin",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(validation.data),
                },
            );

            if (!response.ok) {
                const body: unknown = await response.json().catch(() => null);
                const message =
                    body !== null &&
                    typeof body === "object" &&
                    "message" in body &&
                    typeof body.message === "string"
                        ? body.message
                        : "Publikasi gagal disimpan. Silakan coba lagi.";

                setError(message);
                return;
            }

            router.push("/admin/publikasi");
            router.refresh();
        } catch {
            setError("Tidak dapat menghubungi server. Silakan coba lagi.");
        } finally {
            setPending(false);
        }
    }

    const inputClass =
        "mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-blue-600";

    return (
        <form
            onSubmit={submit}
            aria-busy={pending}
            className="rounded-xl border border-slate-200 bg-white p-6"
        >
            {error && (
                <p
                    role="alert"
                    className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-800"
                >
                    {error}
                </p>
            )}

            <fieldset disabled={pending} className="space-y-6 disabled:opacity-70">
                <legend className="sr-only">Data publikasi ilmiah</legend>

                <div className="grid gap-6 sm:grid-cols-2">
                    <label className="block text-sm font-medium text-slate-700">
                        Jenis publikasi
                        <select
                            value={form.jenis}
                            onChange={(event) => setForm((previous) => ({
                                ...previous,
                                jenis: event.target.value,
                            }))}
                            className={inputClass}
                        >
                            <option value="TESIS">Tesis</option>
                            <option value="ARTIKEL">Artikel ilmiah</option>
                        </select>
                    </label>

                    <label className="block text-sm font-medium text-slate-700">
                        Tahun publikasi
                        <input
                            type="number"
                            required
                            min={1900}
                            max={maxYear}
                            step={1}
                            value={form.tahun}
                            onChange={(event) => setForm((previous) => ({
                                ...previous,
                                tahun: event.target.value,
                            }))}
                            className={inputClass}
                        />
                    </label>
                </div>

                {fields.map((field) => {
                    const id = `publication-${field.name}`;
                    const helpId = `${id}-help`;
                    const props = {
                        id,
                        name: field.name,
                        value: form[field.name],
                        required: field.required,
                        maxLength: field.maxLength,
                        "aria-describedby": field.help ? helpId : undefined,
                        className: inputClass,
                        onChange: (
                            event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
                        ) => setForm((previous) => ({
                            ...previous,
                            [field.name]: event.target.value,
                        })),
                    };

                    return (
                        <div key={field.name}>
                            <label
                                htmlFor={id}
                                className="block text-sm font-medium text-slate-700"
                            >
                                {field.label}
                            </label>

                            {field.rows ? (
                                <textarea {...props} rows={field.rows} />
                            ) : (
                                <input {...props} type={field.type ?? "text"} />
                            )}

                            {field.help && (
                                <p id={helpId} className="mt-2 text-xs text-slate-500">
                                    {field.help}
                                </p>
                            )}
                        </div>
                    );
                })}

                <div className="rounded-lg bg-slate-50 p-4">
                    <label className="flex items-start gap-3 text-sm font-medium text-slate-800">
                        <input
                            type="checkbox"
                            checked={form.ditampilkan}
                            onChange={(event) => setForm((previous) => ({
                                ...previous,
                                ditampilkan: event.target.checked,
                            }))}
                            className="mt-1 h-4 w-4"
                        />
                        Tampilkan di website
                    </label>
                    <p className="mt-2 text-sm text-slate-600">
                        Aktifkan setelah data diperiksa dan publikasi boleh
                        ditampilkan kepada pengunjung.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <button
                        type="submit"
                        className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-wait"
                    >
                        {pending ? "Menyimpan…" : "Simpan Publikasi"}
                    </button>
                    <Link
                        href="/admin/publikasi"
                        className="text-sm font-medium text-slate-600 hover:underline"
                    >
                        Kembali ke daftar
                    </Link>
                </div>
            </fieldset>
        </form>
    );
}
