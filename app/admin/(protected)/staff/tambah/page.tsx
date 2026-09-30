"use client";

import { FormEvent } from "react";

export default function TambahStaffPage() {
    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const form = new FormData(event.currentTarget);

        const nama = form.get("nama")?.toString() ?? "";
        const pendidikan = form.get("pendidikan")?.toString() ?? "";
        const jabatan = form.get("jabatan")?.toString() ?? "";
        const lingkupKerja =
            form.get("lingkupKerja")?.toString() ?? "";
        const foto = form.get("foto")?.toString() ?? "";

        const response = await fetch("/api/staff", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                nama,
                pendidikan,
                jabatan,
                lingkupKerja,
                foto,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            alert(error.message ?? "Gagal menambahkan staff");
            return;
        }

        alert("Staff berhasil ditambahkan");
        window.location.href = "/admin/staff";
    }

    return (
        <main>
            <h1>Tambah Staff</h1>

            <form onSubmit={handleSubmit}>
                <div>
                    <label>Nama</label>
                    <input name="nama" required />
                </div>

                <div>
                    <label>Pendidikan</label>
                    <input
                        name="pendidikan"
                        placeholder="Latar belakang pendidikan"
                    />
                </div>

                <div>
                    <label>Jabatan</label>
                    <input name="jabatan" required />
                </div>

                <div>
                    <label>Lingkup Kerja</label>
                    <input
                        name="lingkupKerja"
                        placeholder="Lingkup kerja"
                    />
                </div>

                <div>
                    <label>Foto</label>
                    <input
                        name="foto"
                        placeholder="URL/path foto"
                    />
                </div>

                <button type="submit">Simpan</button>
            </form>
        </main>
    );
}
