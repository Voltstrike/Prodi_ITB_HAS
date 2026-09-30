"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TambahInformasiAkademikPage() {
    const router = useRouter();

    const [judul, setJudul] = useState("");
    const [deskripsi, setDeskripsi] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch("/api/informasi-akademik", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    judul,
                    deskripsi,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Gagal menambahkan informasi");
            }

            router.push("/admin/akademik/informasi");
            router.refresh();
        } catch (error) {
            console.error(error);
            alert(
                error instanceof Error
                    ? error.message
                    : "Gagal menambahkan informasi akademik."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main>
            <h1>Tambah Informasi Akademik</h1>

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

                <button type="submit" disabled={loading}>
                    {loading ? "Menyimpan..." : "Simpan"}
                </button>
            </form>
        </main>
    );
}
