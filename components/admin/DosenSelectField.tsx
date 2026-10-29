"use client";

type Props = {
    dosen: { id: number; nama: string }[];
    initialId?: number;
    disabled?: boolean;
};

export default function DosenSelectField({
    dosen,
    initialId,
    disabled = false,
}: Props) {
    return (
        <div>
            <label
                htmlFor="dosenId"
                className="block text-sm font-medium text-slate-700"
            >
                Dosen
            </label>

            <select
                id="dosenId"
                name="dosenId"
                required
                defaultValue={initialId ?? ""}
                disabled={disabled || dosen.length === 0}
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
            >
                <option value="" disabled>
                    Pilih dosen
                </option>

                {dosen.map((item) => (
                    <option key={item.id} value={item.id}>
                        {item.nama}
                    </option>
                ))}
            </select>

            {dosen.length === 0 && (
                <p className="mt-2 text-sm text-slate-500">
                    Belum ada data dosen. Tambahkan melalui menu Dosen.
                </p>
            )}
        </div>
    );
}
