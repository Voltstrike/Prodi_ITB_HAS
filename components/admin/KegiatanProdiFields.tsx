"use client";

import type { toKegiatanProdiDto } from "@/lib/http/dto";

type Props = {
    initialValue?: ReturnType<typeof toKegiatanProdiDto>;
    disabled?: boolean;
};

const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600";

export default function KegiatanProdiFields({
    initialValue,
    disabled = false,
}: Props) {
    const currentYear = new Date().getFullYear();

    return (
        <fieldset disabled={disabled} className="space-y-5">
            <legend className="mb-4 font-semibold text-slate-900">
                Informasi Kegiatan
            </legend>

            <label className="block space-y-2 text-sm text-slate-700">
                <span>Judul Kegiatan</span>
                <input
                    name="judul"
                    required
                    maxLength={300}
                    defaultValue={initialValue?.judul ?? ""}
                    className={inputClass}
                />
            </label>

            <label className="block space-y-2 text-sm text-slate-700">
                <span>Jenis Kegiatan</span>
                <select
                    name="jenis"
                    required
                    defaultValue={initialValue?.jenis ?? "PENELITIAN"}
                    className={inputClass}
                >
                    <option value="PENELITIAN">Penelitian</option>
                    <option value="PENGABDIAN">Pengabdian Masyarakat</option>
                </select>
            </label>

            <label className="block space-y-2 text-sm text-slate-700">
                <span>Tahun</span>
                <input
                    type="number"
                    name="tahun"
                    required
                    min={1900}
                    max={currentYear + 1}
                    step={1}
                    defaultValue={initialValue?.tahun ?? currentYear}
                    className={inputClass}
                />
            </label>

            <label className="block space-y-2 text-sm text-slate-700">
                <span>Ringkasan</span>
                <textarea
                    name="ringkasan"
                    required
                    rows={4}
                    maxLength={2000}
                    defaultValue={initialValue?.ringkasan ?? ""}
                    className={inputClass}
                />
            </label>

            <label className="block space-y-2 text-sm text-slate-700">
                <span>Uraian Lengkap</span>
                <textarea
                    name="uraian"
                    required
                    rows={10}
                    maxLength={20000}
                    defaultValue={initialValue?.uraian ?? ""}
                    className={inputClass}
                />
            </label>

            <label className="block space-y-2 text-sm text-slate-700">
                <span>Tautan Hasil (opsional)</span>
                <input
                    type="url"
                    name="tautanHasil"
                    maxLength={2048}
                    placeholder="https://..."
                    defaultValue={initialValue?.tautanHasil ?? ""}
                    className={inputClass}
                />
            </label>
        </fieldset>
    );
}