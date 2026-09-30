"use client";

import { FormEvent, useEffect, useState } from "react";

type Staff = {
    id: number;
    nama: string;
    pendidikan: string | null;
    jabatan: string;
    lingkupKerja: string | null;
    foto: string | null;
};

export default function EditStaffPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const [staffId, setStaffId] = useState<string | null>(null);
    const [staff, setStaff] = useState<Staff | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        params.then(({ id }) => {
            setStaffId(id);

            fetch(`/api/staff/${id}`)
                .then(async (response) => {
                    if (!response.ok) {
                        const error = await response.json();
                        throw new Error(
                            error.message ?? "Gagal mengambil data staff"
                        );
                    }

                    return response.json();
                })
                .then((data) => {
                    setStaff(data);
                    setLoading(false);
                })
                .catch((error) => {
                    alert(error.message);
                    window.location.href = "/admin/staff";
                });
        });
    }, [params]);

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        if (!staffId) {
            return;
        }

        const form = new FormData(event.currentTarget);

        const nama = form.get("nama")?.toString() ?? "";
        const pendidikan = form.get("pendidikan")?.toString() ?? "";
        const jabatan = form.get("jabatan")?.toString() ?? "";
        const lingkupKerja =
            form.get("lingkupKerja")?.toString() ?? "";
        const foto = form.get("foto")?.toString() ?? "";

        const response = await fetch(`/api/staff/${staffId}`, {
            method: "PUT",
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
            alert(error.message ?? "Gagal mengubah staff");
            return;
        }

        alert("Staff berhasil diubah");
        window.location.href = "/admin/staff";
    }

    if (loading) {
        return <main>Memuat data staff...</main>;
    }

    if (!staff) {
        return null;
    }

    return (
        <main>
            <h1>Edit Staff</h1>

            <form onSubmit={handleSubmit}>
                <div>
                    <label>Nama</label>
                    <input
                        name="nama"
                        defaultValue={staff.nama}
                        required
                    />
                </div>

                <div>
                    <label>Pendidikan</label>
                    <input
                        name="pendidikan"
                        defaultValue={staff.pendidikan ?? ""}
                        placeholder="Latar belakang pendidikan"
                    />
                </div>

                <div>
                    <label>Jabatan</label>
                    <input
                        name="jabatan"
                        defaultValue={staff.jabatan}
                        required
                    />
                </div>

                <div>
                    <label>Lingkup Kerja</label>
                    <input
                        name="lingkupKerja"
                        defaultValue={staff.lingkupKerja ?? ""}
                        placeholder="Lingkup kerja"
                    />
                </div>

                <div>
                    <label>Foto</label>
                    <input
                        name="foto"
                        defaultValue={staff.foto ?? ""}
                        placeholder="URL/path foto"
                    />
                </div>

                <button type="submit">Simpan Perubahan</button>
            </form>
        </main>
    );
}
