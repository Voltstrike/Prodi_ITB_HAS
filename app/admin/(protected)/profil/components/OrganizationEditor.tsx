"use client";

import { useEffect, useState } from "react";
import OrganizationChart from "@/components/OrganizationChart";
import {
    availableOrganizationParents,
    MAX_ORGANIZATION_NODES,
    MAX_POSITION_LENGTH,
    organizationPersonKey,
    validateOrganizationStructure,
    type OrganizationNode,
    type OrganizationPerson,
    type OrganizationStructure,
} from "@/lib/organization/structure";

type Props = {
    value: OrganizationStructure | null;
    onChange: (value: OrganizationStructure) => void;
    disabled?: boolean;
    legacyText?: string | null;
};

function isPerson(value: unknown): value is OrganizationPerson {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const row = value as Record<string, unknown>;
    return (row.type === "dosen" || row.type === "staff") &&
        typeof row.id === "number" && Number.isSafeInteger(row.id) &&
        row.id > 0 && row.id <= 2_147_483_647 &&
        typeof row.nama === "string";
}

export default function OrganizationEditor({
    value, onChange, disabled = false, legacyText,
}: Props) {
    const [people, setPeople] = useState<OrganizationPerson[]>([]);
    const [loadState, setLoadState] =
        useState<"loading" | "ready" | "error">("loading");
    const [loadError, setLoadError] = useState("");
    const [reload, setReload] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        let active = true;

        async function loadPeople() {
            try {
                const response = await fetch(
                    "/api/admin/struktur-organisasi/pilihan",
                    { cache: "no-store", signal: controller.signal },
                );
                const data: unknown = await response.json();

                if (!response.ok) {
                    throw new Error(response.status === 401
                        ? "Sesi berakhir. Silakan login kembali."
                        : "Gagal memuat pilihan Dosen dan Staff.");
                }

                if (!Array.isArray(data) || !data.every(isPerson)) {
                    throw new Error("Pilihan Dosen dan Staff tidak dapat dibaca.");
                }

                if (active) {
                    setPeople(data);
                    setLoadError("");
                    setLoadState("ready");
                }
            } catch (error) {
                if (active) {
                    setLoadError(error instanceof Error
                        ? error.message
                        : "Gagal memuat pilihan orang.");
                    setLoadState("error");
                }
            }
        }

        void loadPeople();

        return () => {
            active = false;
            controller.abort();
        };
    }, [reload]);

    const nodes = value?.nodes ?? [];
    const validation = value === null
        ? null
        : validateOrganizationStructure(value);
    const knownPeople = new Set(people.map(organizationPersonKey));
    const missingPerson = loadState === "ready" && nodes.some((node) =>
        node.person !== null &&
        !knownPeople.has(organizationPersonKey(node.person)),
    );

    function updateNode(
        id: string,
        change: Partial<Omit<OrganizationNode, "id">>,
    ) {
        onChange({
            version: 1,
            nodes: nodes.map((node) =>
                node.id === id ? { ...node, ...change } : node,
            ),
        });
    }

    function addNode() {
        if (nodes.length >= MAX_ORGANIZATION_NODES) return;
        const root = nodes.find((node) => node.parentId === null);

        onChange({
            version: 1,
            nodes: [...nodes, {
                id: crypto.randomUUID(),
                jabatan: "",
                person: null,
                parentId: root?.id ?? null,
            }],
        });
    }

    function removeNode(id: string) {
        if (nodes.some((node) => node.parentId === id)) return;
        onChange({
            version: 1,
            nodes: nodes.filter((node) => node.id !== id),
        });
    }

    return (
        <div className="min-w-0 space-y-5 border-b border-slate-200 pb-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h3 className="text-base font-semibold text-slate-900">
                        Struktur Organisasi
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
                        Tambahkan jabatan, pilih orang, dan tentukan atasan langsungnya.
                        Pilihan orang boleh dikosongkan jika jabatan belum terisi.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={addNode}
                    disabled={disabled || loadState !== "ready" ||
                        nodes.length >= MAX_ORGANIZATION_NODES}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    + Tambah Jabatan
                </button>
            </div>

            {legacyText?.trim() && (
                <details className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
                    <summary className="cursor-pointer font-medium text-slate-700">
                        Lihat teks struktur sebelumnya
                    </summary>
                    <p className="mt-3 whitespace-pre-line break-words leading-relaxed text-slate-600">
                        {legacyText.trim()}
                    </p>
                    <p className="mt-3 text-xs text-slate-500">
                        {value === null
                            ? "Teks ini tetap tampil di halaman publik sampai bagan pertama disimpan."
                            : "Teks sebelumnya tetap tersimpan sebagai referensi."}
                    </p>
                </details>
            )}

            {loadState === "loading" && (
                <p role="status" className="text-sm text-slate-500">
                    Memuat pilihan Dosen dan Staff...
                </p>
            )}

            {loadState === "error" && (
                <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <p>{loadError}</p>
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                            setLoadState("loading");
                            setReload((current) => current + 1);
                        }}
                        className="mt-2 font-semibold underline underline-offset-4 disabled:opacity-50"
                    >
                        Coba Lagi
                    </button>
                </div>
            )}

            {loadState === "ready" && people.length === 0 && (
                <p className="rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
                    Belum ada data Dosen atau Staff. Tambahkan melalui menu Dosen
                    atau Staff, kemudian buka ulang halaman ini untuk memilih orang.
                </p>
            )}

            {nodes.length === 0 && (
                <p className="rounded-lg border border-dashed border-slate-300 p-5 text-sm text-slate-500">
                    Belum ada jabatan pada bagan. Gunakan tombol Tambah Jabatan
                    untuk mulai menyusun.
                </p>
            )}

            <div className="space-y-4">
                {nodes.map((node, index) => {
                    const selected = node.person
                        ? organizationPersonKey(node.person)
                        : "";
                    const selectedMissing = loadState === "ready" &&
                        selected !== "" && !knownPeople.has(selected);
                    const hasReports = nodes.some(
                        (candidate) => candidate.parentId === node.id,
                    );

                    return (
                        <fieldset
                            key={node.id}
                            disabled={disabled || loadState !== "ready"}
                            className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5"
                        >
                            <legend className="px-1 text-sm font-semibold text-slate-800">
                                Jabatan {index + 1}
                            </legend>

                            <div className="grid gap-4 lg:grid-cols-3">
                                <div className="min-w-0">
                                    <label
                                        htmlFor={`org-jabatan-${node.id}`}
                                        className="mb-2 block text-sm font-medium text-slate-700"
                                    >
                                        Nama Jabatan
                                    </label>
                                    <input
                                        id={`org-jabatan-${node.id}`}
                                        required
                                        maxLength={MAX_POSITION_LENGTH}
                                        value={node.jabatan}
                                        onChange={(event) => updateNode(
                                            node.id,
                                            { jabatan: event.target.value },
                                        )}
                                        placeholder="Contoh: Ketua Program Studi"
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                                <div className="min-w-0">
                                    <label
                                        htmlFor={`org-person-${node.id}`}
                                        className="mb-2 block text-sm font-medium text-slate-700"
                                    >
                                        Pemangku Jabatan
                                    </label>
                                    <select
                                        id={`org-person-${node.id}`}
                                        value={selected}
                                        onChange={(event) => {
                                            const person = people.find(
                                                (candidate) =>
                                                    organizationPersonKey(candidate) ===
                                                    event.target.value,
                                            );
                                            updateNode(node.id, {
                                                person: person
                                                    ? { type: person.type, id: person.id }
                                                    : null,
                                            });
                                        }}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    >
                                        <option value="">Belum ditetapkan</option>
                                        {selectedMissing && (
                                            <option value={selected} disabled>
                                                Data orang tidak tersedia — pilih pengganti
                                            </option>
                                        )}
                                        <optgroup label="Dosen">
                                            {people.filter((person) =>
                                                person.type === "dosen",
                                            ).map((person) => (
                                                <option
                                                    key={organizationPersonKey(person)}
                                                    value={organizationPersonKey(person)}
                                                >
                                                    {person.nama}
                                                </option>
                                            ))}
                                        </optgroup>
                                        <optgroup label="Staff">
                                            {people.filter((person) =>
                                                person.type === "staff",
                                            ).map((person) => (
                                                <option
                                                    key={organizationPersonKey(person)}
                                                    value={organizationPersonKey(person)}
                                                >
                                                    {person.nama}
                                                </option>
                                            ))}
                                        </optgroup>
                                    </select>
                                </div>

                                <div className="min-w-0">
                                    <label
                                        htmlFor={`org-parent-${node.id}`}
                                        className="mb-2 block text-sm font-medium text-slate-700"
                                    >
                                        Atasan Langsung
                                    </label>
                                    <select
                                        id={`org-parent-${node.id}`}
                                        value={node.parentId ?? ""}
                                        onChange={(event) => updateNode(
                                            node.id,
                                            { parentId: event.target.value || null },
                                        )}
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    >
                                        <option value="">
                                            Tidak ada (jabatan tertinggi)
                                        </option>
                                        {availableOrganizationParents(
                                            nodes, node.id,
                                        ).map((parent) => (
                                            <option key={parent.id} value={parent.id}>
                                                {parent.jabatan.trim() ||
                                                    `Jabatan ${nodes.findIndex(
                                                        (candidate) =>
                                                            candidate.id === parent.id,
                                                    ) + 1}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                                <p className="max-w-xl text-xs text-slate-500">
                                    {hasReports
                                        ? "Pindahkan atau hapus jabatan di bawahnya terlebih dahulu untuk menghapus jabatan ini."
                                        : "Perubahan diterbitkan setelah menekan Simpan Perubahan."}
                                </p>
                                <button
                                    type="button"
                                    disabled={hasReports}
                                    onClick={() => removeNode(node.id)}
                                    className="text-sm font-medium text-red-600 hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline"
                                >
                                    Hapus Jabatan
                                </button>
                            </div>
                        </fieldset>
                    );
                })}
            </div>

            {validation && !validation.ok && (
                <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    {validation.error}
                </p>
            )}

            {missingPerson && (
                <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    Ada pilihan orang yang sudah tidak tersedia. Pilih pengganti
                    atau kosongkan pilihannya sebelum menyimpan.
                </p>
            )}

            {value !== null && (
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-900">
                        Pratinjau Bagan
                    </h4>
                    <p className="text-xs text-slate-500">
                        Pratinjau mengikuti isian di atas. Gunakan Simpan Perubahan
                        untuk menerbitkannya.
                    </p>
                    {loadState === "ready" && validation?.ok
                        ? <OrganizationChart
                            structure={validation.value}
                            people={people}
                        />
                        : <p className="rounded-lg bg-slate-50 p-5 text-sm text-slate-500">
                            Lengkapi isian dan muat pilihan orang untuk melihat pratinjau.
                        </p>}
                </div>
            )}
        </div>
    );
}
