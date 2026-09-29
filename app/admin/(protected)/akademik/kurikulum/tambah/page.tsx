"use client";

import { FormEvent } from "react";

export default function TambahKurikulumPage() {
    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        const form = new FormData(event.currentTarget);

        const kode = form.get("kode")?.toString() ?? "";
        const nama = form.get("nama")?.toString() ?? "";
        const sks = form.get("sks")?.toString() ?? "";
        const semester = form.get("semester")?.toString() ?? "";
        const jenis = form.get("jenis")?.toString() ?? "";

        const response = await fetch("/api/kurikulum", {
            method: "POST",
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
        });

        if (!response.ok) {
            const error = await response.json();

            alert(
                error.message ??
                    "Gagal menambahkan mata kuliah"
            );

            return;
        }

        alert("Mata kuliah berhasil ditambahkan");

        window.location.href =
            "/admin/akademik/kurikulum";
    }

    return (
        <main>
            <h1>Tambah Mata Kuliah</h1>

            <form onSubmit={handleSubmit}>
                <div>
                    <label>Kode</label>
                    <input
                        name="kode"
                        required
                    />
                </div>

                <div>
                    <label>Nama Mata Kuliah</label>
                    <input
                        name="nama"
                        required
                    />
                </div>

                <div>
                    <label>SKS</label>
                    <input
                        name="sks"
                        type="number"
                        min="1"
                        required
                    />
                </div>

                <div>
                    <label>Semester</label>
                    <input
                        name="semester"
                        type="number"
                        min="1"
                        required
                    />
                </div>

                <div>
                    <label>Jenis</label>
                    <select name="jenis" required>
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
                    Simpan
                </button>
            </form>
        </main>
    );
}
