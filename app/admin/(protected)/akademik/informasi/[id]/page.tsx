"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type InformasiAkademik = {
    id: number;
    judul: string;
    deskripsi: string;
};

export default function EditInformasiAkademikPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();

    const [judul, setJudul] = useState("");
    const [deskripsi, setDeskripsi] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function loadData() {
            try {
                const response = await fetch(
                    `/api/informasi-akademik/${params.id}`
                );

                if (!response.ok) {
                    throw new Error("Informasi akademik tidak ditemukan");
                }

                const data: InformasiAkademik = await response.json();

                setJudul(data.judul);
                setDeskripsi(data.deskripsi);
            } catch (error) {
                console.error(error);
                alert(
                    error instanceof Error
                        ? error.message
                        : "Gagal memuat informasi akademik."
                );
                router.push("/admin/akademik/informasi");
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [params.id, router]);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setSaving(true);

        try {
            const response = await fetch(
                `/api/informasi-akademik/${params.id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        judul,
                        deskripsi,
                    }),
                }
            );

            if (!response.ok) {
                const data = await response.json();
                throw new Error(
                    data.message || "Gagal memperbarui informasi"
                );
            }

            router.push("/admin/akademik/informasi");
            router.refresh();
        } catch (error) {
            console.error(error);
            alert(
                error instanceof Error
                    ? error.message
                    : "Gagal memperbarui informasi akademik."
            );
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return <p>Memuat...</p>;
    }

    return (
        <main>
            <h1>Edit Informasi Akademik</h1>

            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="judul">Judul</label>
                    <br />
                    <input
                        id="judul"
                        type="text"
                        value={judul}
                        onChange={(e) => setJudul(e.target.value)}
                        required
                    />
                </div>

                <br />

                <div>
                    <label htmlFor="deskripsi">Deskripsi</label>
                    <br />
                    <textarea
                        id="deskripsi"
                        value={deskripsi}
                        onChange={(e) => setDeskripsi(e.target.value)}
                        required
                        rows={6}
                    />
                </div>

                <br />

                <button type="submit" disabled={saving}>
                    {saving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
            </form>
        </main>
    );
}
