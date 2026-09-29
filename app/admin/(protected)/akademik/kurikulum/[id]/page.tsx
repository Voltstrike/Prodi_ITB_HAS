"use client";

import { FormEvent, useEffect, useState } from "react";

interface Kurikulum {
    id: number;
    kode: string;
    nama: string;
    sks: number;
    semester: number;
    jenis: string;
}

export default function EditKurikulumPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const [kurikulum, setKurikulum] =
        useState<Kurikulum | null>(null);

    useEffect(() => {
        async function loadKurikulum() {
            const { id } = await params;

            const response = await fetch(
                `/api/kurikulum/${id}`
            );

            if (!response.ok) {
                return;
            }

            const data: Kurikulum = await response.json();

            setKurikulum(data);
        }

        loadKurikulum();
    }, [params]);

    if (!kurikulum) {
        return (
            <main>
                Data kurikulum tidak ditemukan.
            </main>
        );
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        if (!kurikulum) {
            return;
        }

        const form = new FormData(event.currentTarget);

        const kode = form.get("kode")?.toString() ?? "";
        const nama = form.get("nama")?.toString() ?? "";
        const sks = form.get("sks")?.toString() ?? "";
        const semester =
            form.get("semester")?.toString() ?? "";
        const jenis = form.get("jenis")?.toString() ?? "";

        const response = await fetch(
            `/api/kurikulum/${kurikulum.id}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    kode,
                    nama,
                    sks,
                    semester,
                    jenis,
                }),
            }
        );

        if (!response.ok) {
            const error = await response.json();

            alert(
                error.message ??
                    "Gagal mengubah mata kuliah"
            );

            return;
        }

        alert("Mata kuliah berhasil diubah");

        window.location.href =
            "/admin/akademik/kurikulum";
    }

    return (
        <main>
            <h1>Edit Mata Kuliah</h1>

            <form onSubmit={handleSubmit}>
                <div>
                    <label>Kode</label>
                    <input
                        name="kode"
                        defaultValue={kurikulum.kode}
                        required
                    />
                </div>

                <div>
                    <label>Nama Mata Kuliah</label>
                    <input
                        name="nama"
                        defaultValue={kurikulum.nama}
                        required
                    />
                </div>

                <div>
                    <label>SKS</label>
                    <input
                        name="sks"
                        type="number"
                        min="1"
                        defaultValue={kurikulum.sks}
                        required
                    />
                </div>

                <div>
                    <label>Semester</label>
                    <input
                        name="semester"
                        type="number"
                        min="1"
                        defaultValue={kurikulum.semester}
                        required
                    />
                </div>

                <div>
                    <label>Jenis</label>
                    <select
                        name="jenis"
                        defaultValue={kurikulum.jenis}
                        required
                    >
                        <option value="">
                            Pilih jenis
                        </option>
                        <option value="Wajib">
                            Wajib
                        </option>
                        <option value="Pilihan">
                            Pilihan
                        </option>
                    </select>
                </div>

                <button type="submit">
                    Simpan Perubahan
                </button>
            </form>
        </main>
    );
}
