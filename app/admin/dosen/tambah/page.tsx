"use client";

import { FormEvent } from "react";

export default function TambahDosenPage() {
    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const form = new FormData(event.currentTarget);

        const nama = form.get("nama")?.toString() ?? "";
        const nidn = form.get("nidn")?.toString() ?? "";
        const jabatan = form.get("jabatan")?.toString() ?? "";
        const bidangKeahlian = form.get("bidangKeahlian")?.toString() ?? "";
        const foto = form.get("foto")?.toString() ?? "";
        const email = form.get("email")?.toString() ?? "";
        const pendidikan = form.get("pendidikan")?.toString() ?? "";
        const profil = form.get("profil")?.toString() ?? "";

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
                jabatan,
                bidangKeahlian,
                foto,
                email,
                pendidikan,
                profil, 
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
                    <input name="nama" required/>
                </div>

                <div>
                    <label>NIDN</label>
                    <input name="nidn" required/>
                </div>

                <div>
                    <label>Jabatan</label>
                    <input name="jabatan" required/>
                </div>

                <div>
                    <label>Bidang Keahlian</label>
                    <input name="bidangKeahlian" required/>
                </div>                

                <div>
                    <label>Foto</label>
                    <input name="foto" required/>
                </div>

                <div>
                    <label>Email</label>
                    <input name="email" required/>
                </div>

                <div>
                    <label>Pendidikan</label>
                    <input name="pendidikan" required/>
                </div>

                <div>
                    <label>Profil</label>
                    <textarea name="profil" required/>
                </div>

                <button type="submit">Simpan</button>
            </form>
        </main>
    );
}
