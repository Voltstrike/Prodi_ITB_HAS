"use client";

import { FormEvent } from "react";

export default function TambahDosenPage() {
    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const form = new FormData(event.currentTarget);

        const nama = form.get("nama")?.toString() ?? "";
        const nidn = form.get("nidn")?.toString() ?? "";
        const pendidikan = form.get("pendidikan")?.toString() ?? "";

        const slug = nama
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");

        const response = await fetch("/api/dosen", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                nama,
                slug,
                nidn,
                pendidikan,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            alert(error.message ?? "Gagal menambahkan dosen");
            return;
        }

        alert("Dosen berhasil ditambahkan");
        window.location.href = "/admin/dosen";
    }

    return (
        <main>
            <h1>Tambah Dosen</h1>

            <form onSubmit={handleSubmit}>
                <div>
                    <label>Nama</label>
                    <input name="nama" required />
                </div>

                <div>
                    <label>NIDN</label>
                    <input name="nidn" required />
                </div>

                <div>
                    <label>Pendidikan</label>
                    <select name="pendidikan" required>
                        <option value="">Pilih pendidikan</option>
                        <option value="S1">S1</option>
                        <option value="S2">S2</option>
                        <option value="S3">S3</option>
                    </select>
                </div>

                <button type="submit">Simpan</button>
            </form>
        </main>
    );
}