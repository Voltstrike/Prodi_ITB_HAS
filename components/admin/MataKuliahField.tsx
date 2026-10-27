"use client";

import type { MataKuliahDosen } from "@/lib/dosen/mata-kuliah-data";

type Props = {
    options: MataKuliahDosen[] | null;
    error: string;
    onRetry: () => void;
    initialIds?: readonly number[];
    disabled?: boolean;
};

export default function MataKuliahField({
    options, error, onRetry, initialIds = [], disabled = false,
}: Props) {
    return (
        <fieldset
            disabled={disabled}
            className="space-y-4 rounded-xl border border-slate-200 bg-white p-6"
        >
            <legend className="px-2 font-semibold text-slate-900">
                Mata Kuliah yang Diajarkan
            </legend>

            {error ? (
                <div role="alert" className="text-sm text-red-700">
                    <p>{error}</p>
                    <button
                        type="button"
                        onClick={onRetry}
                        className="mt-2 font-semibold underline"
                    >
                        Coba lagi
                    </button>
                </div>
            ) : options === null ? (
                <p role="status" className="text-sm text-slate-500">
                    Memuat mata kuliah...
                </p>
            ) : options.length === 0 ? (
                <p className="text-sm text-slate-500">
                    Belum ada mata kuliah. Tambahkan melalui menu Kurikulum.
                </p>
            ) : (
                <div className="grid max-h-80 gap-3 overflow-y-auto sm:grid-cols-2">
                    {options.map((item) => (
                        <label
                            key={item.id}
                            className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3"
                        >
                            <input
                                type="checkbox"
                                name="mataKuliahIds"
                                value={item.id}
                                defaultChecked={initialIds.includes(item.id)}
                                className="mt-1 h-4 w-4 accent-blue-700"
                            />
                            <span className="min-w-0">
                                <span className="block text-sm font-medium text-slate-900">
                                    {item.nama}
                                </span>
                                <span className="text-xs text-slate-500">
                                    {item.kode} · Semester {item.semester} · {item.sks} SKS
                                </span>
                            </span>
                        </label>
                    ))}
                </div>
            )}
        </fieldset>
    );
}