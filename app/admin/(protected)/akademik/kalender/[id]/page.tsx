"use client";

import { FormEvent, useEffect, useState } from "react";

interface KalenderAkademik {
    id: number;
    kegiatan: string;
    tanggalMulai: string;
    tanggalSelesai: string;
}

export default function EditKalenderPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const [kalender, setKalender] =
        useState<KalenderAkademik | null>(null);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadKalender() {
            const { id } = await params;

            const response = await fetch(
                `/api/kalender-akademik/${id}`
            );

            if (!response.ok) {
                alert(
                    "Gagal mengambil data kalender akademik"
                );
                setLoading(false);
                return;
            }

            const data = await response.json();

            setKalender(data);
            setLoading(false);
        }

        loadKalender();
    }, [params]);

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        if (!kalender) {
            return;
        }

        const form = new FormData(event.currentTarget);

        const kegiatan =
            form.get("kegiatan")?.toString() ?? "";

        const tanggalMulai =
            form.get("tanggalMulai")?.toString() ?? "";

        const tanggalSelesai =
            form.get("tanggalSelesai")?.toString() ?? "";

        const response = await fetch(
            `/api/kalender-akademik/${kalender.id}`,
            {
                method: "PUT",
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
                    "Gagal mengubah kalender akademik"
            );

            return;
        }

        alert(
            "Kalender akademik berhasil diubah"
        );

        window.location.href =
            "/admin/akademik/kalender";
    }

    if (loading) {
        return <p>Memuat...</p>;
    }

    if (!kalender) {
        return (
            <main>
                <p>
                    Kalender akademik tidak ditemukan.
                </p>
            </main>
        );
    }

    return (
        <main>
            <h1>Edit Kalender Akademik</h1>

            <form onSubmit={handleSubmit}>
                <div>
                    <label>Kegiatan</label>
                    <input
                        name="kegiatan"
                        defaultValue={kalender.kegiatan}
                        required
                    />
                </div>

                <div>
                    <label>Tanggal Mulai</label>
                    <input
                        name="tanggalMulai"
                        defaultValue={
                            kalender.tanggalMulai
                        }
                        required
                    />
                </div>

                <div>
                    <label>Tanggal Selesai</label>
                    <input
                        name="tanggalSelesai"
                        defaultValue={
                            kalender.tanggalSelesai
                        }
                        required
                    />
                </div>

                <button type="submit">
                    Simpan Perubahan
                </button>
            </form>
        </main>
    );
}
