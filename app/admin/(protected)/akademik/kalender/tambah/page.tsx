"use client";

import { useRouter } from "next/navigation";

import { FormEvent } from "react";

export default function TambahKalenderPage() {
    const router = useRouter();

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        const form = new FormData(event.currentTarget);

        const kegiatan =
            form.get("kegiatan")?.toString() ?? "";

        const tanggalMulai =
            form.get("tanggalMulai")?.toString() ?? "";

        const tanggalSelesai =
            form.get("tanggalSelesai")?.toString() ?? "";

        const response = await fetch(
            "/api/kalender-akademik",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    kegiatan,
                    tanggalMulai,
                    tanggalSelesai,
                }),
            }
        );

        if (!response.ok) {
            const error = await response.json();

            alert(
                error.message ??
                    "Gagal menambahkan kalender akademik"
            );

            return;
        }

        alert(
            "Kalender akademik berhasil ditambahkan"
        );

        router.push("/admin/akademik/kalender");
        router.refresh();
    }

    return (
        <main>
            <h1>Tambah Kegiatan Kalender Akademik</h1>

            <form onSubmit={handleSubmit}>
                <div>
                    <label>Kegiatan</label>
                    <input
                        name="kegiatan"
                        required
                    />
                </div>

                <div>
                    <label>Tanggal Mulai</label>
                    <input
                        name="tanggalMulai"
                        required
                    />
                </div>

                <div>
                    <label>Tanggal Selesai</label>
                    <input
                        name="tanggalSelesai"
                        required
                    />
                </div>

                <button type="submit">
                    Simpan
                </button>
            </form>
        </main>
    );
}
