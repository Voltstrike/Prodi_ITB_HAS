"use client";

import { FormEvent } from "react";

export default function TambahDosenPage() {
    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const form = new FormData(event.currentTarget);

        const nama = form.get("nama")?.toString() ?? "";
        const nidn = form.get("nidn")?.toString() ?? "";
        const pendidikanS1 =
            form.get("pendidikanS1")?.toString() ?? "";
        const pendidikanS2 =
            form.get("pendidikanS2")?.toString() ?? "";
        const pendidikanS3 =
            form.get("pendidikanS3")?.toString() ?? "";

        const response = await fetch("/api/dosen", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                nama,
                nidn,
                pendidikanS1,
                pendidikanS2,
                pendidikanS3,
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
                    <label>S1</label>
                    <input
                        name="pendidikanS1"
                        placeholder="Nama perguruan tinggi"
                    />
                </div>

                <div>
                    <label>S2</label>
                    <input
                        name="pendidikanS2"
                        placeholder="Nama perguruan tinggi"
                    />
                </div>

                <div>
                    <label>S3</label>
                    <input
                        name="pendidikanS3"
                        placeholder="Nama perguruan tinggi"
                    />
                </div>

                <button type="submit">Simpan</button>
            </form>
        </main>
    );
}