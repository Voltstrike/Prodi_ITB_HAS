"use client";

import { FormEvent, useEffect, useState } from "react";

interface Dosen {
    id: number;
    slug: string;
    nama: string;
    nidn: string;
    foto: string | null;
    pendidikanS1: string | null;
    pendidikanS2: string | null;
    pendidikanS3: string | null;
    profil: string | null;
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

        if (!dosen) {
            return;
        }

        const form = new FormData(event.currentTarget);

        const nama = form.get("nama")?.toString() ?? "";
        const nidn = form.get("nidn")?.toString() ?? "";
        const foto = form.get("foto")?.toString() ?? "";
        const pendidikanS1 =
            form.get("pendidikanS1")?.toString() ?? "";
        const pendidikanS2 =
            form.get("pendidikanS2")?.toString() ?? "";
        const pendidikanS3 =
            form.get("pendidikanS3")?.toString() ?? "";
        const profil = form.get("profil")?.toString() ?? "";

        const response = await fetch(`/api/dosen/${dosen.slug}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                nama,
                nidn,
                foto,
                pendidikanS1,
                pendidikanS2,
                pendidikanS3,
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
                    <input
                        name="nama"
                        defaultValue={dosen.nama}
                        required
                    />
                </div>

                <div>
                    <label>NIDN</label>
                    <input
                        name="nidn"
                        defaultValue={dosen.nidn}
                        required
                    />
                </div>

                <div>
                    <label>S1</label>
                    <input
                        name="pendidikanS1"
                        defaultValue={dosen.pendidikanS1 ?? ""}
                        placeholder="Nama perguruan tinggi"
                    />
                </div>

                <div>
                    <label>S2</label>
                    <input
                        name="pendidikanS2"
                        defaultValue={dosen.pendidikanS2 ?? ""}
                        placeholder="Nama perguruan tinggi"
                    />
                </div>

                <div>
                    <label>S3</label>
                    <input
                        name="pendidikanS3"
                        defaultValue={dosen.pendidikanS3 ?? ""}
                        placeholder="Nama perguruan tinggi"
                    />
                </div>

                <div>
                    <label>Foto</label>
                    <input
                        name="foto"
                        defaultValue={dosen.foto ?? ""}
                    />
                </div>

                <div>
                    <label>Profil</label>
                    <textarea
                        name="profil"
                        defaultValue={dosen.profil ?? ""}
                    />
                </div>

                <button type="submit">
                    Simpan Perubahan
                </button>
            </form>
        </main>
    );
}