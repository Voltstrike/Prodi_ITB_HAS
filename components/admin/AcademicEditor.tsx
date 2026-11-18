"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { academicDateLabel } from "@/lib/akademik/policy";

type Entry = {
    id: number;
    status: string;
    kegiatan?: string;
    tanggalMulai?: string;
    tanggalSelesai?: string;
    semester?: string | null;
    tahunAkademik?: string | null;
    keterangan?: string | null;
    judul?: string;
    deskripsi?: string;
    utama?: boolean;
};

type Props = { kind: "kalender" | "informasi"; entry?: Entry };

const field = "mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 focus:border-blue-600";
const secondary = "rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium disabled:opacity-50";
const primary = "rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50";

export default function AcademicEditor({ kind, entry }: Props) {
    const router = useRouter();
    const form = useRef<HTMLFormElement>(null);
    const busy = useRef(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [preview, setPreview] = useState<FormData | null>(null);

    const calendar = kind === "kalender";
    const slug = calendar ? "kalender-akademik" : "informasi-akademik";
    const section = calendar ? "Kalender Akademik" : "Informasi Akademik";
    const published = entry?.status === "PUBLISHED";
    const publicButton = published ? "Simpan perubahan" : "Terbitkan";

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (busy.current) return;

        const button = (event.nativeEvent as SubmitEvent).submitter;
        const status = button instanceof HTMLButtonElement
            ? button.value
            : entry?.status ?? "DRAFT";

        if (published && status === "DRAFT" &&
            !window.confirm("Tarik dari halaman publik dan simpan sebagai draf?")) return;

        const data = new FormData(event.currentTarget);
        const payload: Record<string, unknown> = { ...Object.fromEntries(data), status };

        if (calendar) {
            // Form lama dapat memiliki tanggal tetapi belum memiliki periode.
            if (published && payload.semester === (entry?.semester ?? "") &&
                payload.tahunAkademik === (entry?.tahunAkademik ?? "")) {
                delete payload.semester;
                delete payload.tahunAkademik;
            }
        } else {
            payload.utama = data.has("utama");
        }

        busy.current = true;
        setSaving(true);
        setError("");
        try {
            const response = await fetch(`/api/admin/${slug}${entry ? "/" + entry.id : ""}`, {
                method: entry ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const result = await response.json().catch(() => null);
                throw new Error(response.status === 401
                    ? "Sesi berakhir. Silakan masuk kembali."
                    : result?.message || "Data gagal disimpan.");
            }
            router.replace("/admin/" + slug);
            router.refresh();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Data gagal disimpan.");
            busy.current = false;
            setSaving(false);
        }
    }

    const value = (name: string) => String(preview?.get(name) ?? "").trim();

    return <div className="mx-auto max-w-4xl space-y-5">
        <Link href={"/admin/" + slug} className="text-sm text-blue-700">
            ← Kembali ke {section}
        </Link>
        <h1 className="text-2xl font-bold">
            {entry ? "Edit" : "Tambah"} {calendar ? "Kegiatan" : "Informasi"}
        </h1>
        {entry && <p className="text-sm text-slate-600">
            Status saat ini · {published ? "Terbit" : "Draf"}
        </p>}

        <form ref={form} onSubmit={submit} onChange={() => { setPreview(null); setError(""); }}>
            <fieldset disabled={saving} className="grid gap-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
                {calendar ? <>
                    <label>Nama kegiatan
                        <input className={field} name="kegiatan" required maxLength={500} defaultValue={entry?.kegiatan} />
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label>Tanggal mulai
                            <input className={field} name="tanggalMulai" required type="date" defaultValue={entry?.tanggalMulai} />
                        </label>
                        <label>Tanggal selesai (opsional)
                            <input className={field} name="tanggalSelesai" type="date" defaultValue={entry?.tanggalSelesai} />
                        </label>
                        <label>Semester
                            <select className={field} name="semester" defaultValue={entry?.semester ?? ""}>
                                <option value="">Pilih semester</option>
                                <option value="GANJIL">Ganjil</option>
                                <option value="GENAP">Genap</option>
                            </select>
                        </label>
                        <label>Tahun akademik
                            <input className={field} name="tahunAkademik" placeholder="2026/2027"
                                maxLength={9} defaultValue={entry?.tahunAkademik ?? ""} />
                        </label>
                    </div>
                    <label>Keterangan (opsional)
                        <textarea className={field} name="keterangan" rows={3} maxLength={2000} defaultValue={entry?.keterangan ?? ""} />
                    </label>
                </> : <>
                    <label>Judul
                        <input className={field} name="judul" required maxLength={300} defaultValue={entry?.judul} />
                    </label>
                    <label>Isi informasi
                        <textarea className={field} name="deskripsi" required rows={7} maxLength={10000} defaultValue={entry?.deskripsi} />
                    </label>
                    <label className="flex items-start gap-3">
                        <input type="checkbox" className="mt-1" name="utama" defaultChecked={entry?.utama} />
                        <span>Jadikan informasi utama
                            <small className="block text-slate-600">
                                Saat diterbitkan, informasi ini tampil di Beranda dan di bagian teratas Informasi Akademik, menggantikan informasi utama sebelumnya.
                            </small>
                        </span>
                    </label>
                </>}
            </fieldset>

            {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
            <div className="mt-4 flex flex-wrap items-center gap-2">
                {published ? <>
                    <button disabled={saving} type="submit" value="PUBLISHED" className={primary}>{publicButton}</button>
                    <button disabled={saving} type="submit" value="DRAFT" className={secondary}>Tarik ke draf</button>
                </> : <>
                    <button disabled={saving} type="submit" value="DRAFT" className={secondary}>Simpan draf</button>
                    <button disabled={saving} type="submit" value="PUBLISHED" className={primary}>{publicButton}</button>
                </>}
                <button type="button" disabled={saving} className={secondary} aria-expanded={!!preview}
                    onClick={() => setPreview(form.current && !preview ? new FormData(form.current) : null)}>
                    {preview ? "Tutup pratinjau" : "Pratinjau"}
                </button>
                {saving && <span role="status" className="text-sm">Menyimpan…</span>}
            </div>
        </form>

        {preview && <section aria-label="Pratinjau" className="space-y-2 rounded-xl border border-blue-200 bg-white p-5">
            <p className="text-sm font-medium text-blue-700">
                Pratinjau{!calendar && preview.has("utama") ? " · Informasi utama" : ""}
            </p>
            <h2 className="text-lg font-bold break-words">
                {value(calendar ? "kegiatan" : "judul") || "Judul belum diisi"}
            </h2>
            {calendar && <p className="text-sm text-slate-600">
                {academicDateLabel(value("tanggalMulai"))}
                {value("tanggalSelesai") && value("tanggalSelesai") !== value("tanggalMulai") &&
                    " – " + academicDateLabel(value("tanggalSelesai"))}
                {value("semester") && " · " + (value("semester") === "GANJIL" ? "Ganjil" : "Genap")}
                {value("tahunAkademik") && " · " + value("tahunAkademik")}
            </p>}
            <p className="whitespace-pre-line break-words">{value(calendar ? "keterangan" : "deskripsi")}</p>
        </section>}
    </div>;
}
