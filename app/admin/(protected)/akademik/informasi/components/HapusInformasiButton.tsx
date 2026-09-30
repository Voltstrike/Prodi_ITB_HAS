"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HapusInformasiButton({
    id,
}: {
    id: number;
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleDelete() {
        const yakin = window.confirm(
            "Yakin ingin menghapus informasi akademik ini?"
        );

        if (!yakin) {
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`/api/informasi-akademik/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Gagal menghapus informasi akademik");
            }

            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Gagal menghapus informasi akademik.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
        >
            {loading ? "Menghapus..." : "Hapus"}
        </button>
    );
}
