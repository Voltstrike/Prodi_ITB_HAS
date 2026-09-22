"use client";

import { FormEvent, useEffect, useState } from "react";

interface Dosen {
    id: number;
    slug: string;
    nama: string;
    nidn: string;
    jabatan: string;
    bidangKeahlian: string;
    foto: string;
    email: string;
    pendidikan: string;
    profil: string;
}

export default function EditDosenPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const [dosen, setDosen] = useState<Dosen | null>(null);

    useEffect(() => {
        async function loadDosen() {
            const { id } = await params;

            const response = await fetch("/api/dosen");

            if (!response.ok) {
                return;
            }

            const data: Dosen[] = await response.json();
            const item = data.find((d) => d.id === Number(id));

            setDosen(item ?? null);
        }

        loadDosen();
    }, [params]);

    if (!dosen) {
        return <main>Data dosen tidak ditemukan.</main>;
    }

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

        const response = await fetch(`/api/dosen/${dosen!.slug}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                nama,
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
    alert(error.message ?? "Gagal mengubah data dosen");
    return;
}

alert("Data dosen berhasil diubah");
window.location.href = "/admin/dosen";
    }

    return (
        <main>
            <h1>Edit Dosen</h1>

            <form onSubmit={handleSubmit}>
                <div>
                    <label>Nama</label>
                    <input name="nama" defaultValue={dosen.nama} required />
                </div>

                <div>
                    <label>NIDN</label>
                    <input name="nidn" defaultValue={dosen.nidn} required />
                </div>

                <div>
                    <label>Jabatan</label>
                    <input name="jabatan" defaultValue={dosen.jabatan} required />
                </div>

                <div>
                    <label>Bidang Keahlian</label>
                    <input
                        name="bidangKeahlian"
                        defaultValue={dosen.bidangKeahlian}
                        required
                    />
                </div>

                <div>
                    <label>Foto</label>
                    <input name="foto" defaultValue={dosen.foto} required />
                </div>

                <div>
                    <label>Email</label>
                    <input
                        name="email"
                        type="email"
                        defaultValue={dosen.email}
                        required
                    />
                </div>

                <div>
                    <label>Pendidikan</label>
                    <input
                        name="pendidikan"
                        defaultValue={dosen.pendidikan}
                        required
                    />
                </div>

                <div>
                    <label>Profil</label>
                    <textarea
                        name="profil"
                        defaultValue={dosen.profil}
                        required
                    />
                </div>

                <button type="submit">Simpan Perubahan</button>
            </form>
        </main>
    );
}