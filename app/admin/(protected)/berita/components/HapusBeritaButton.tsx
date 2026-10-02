"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface HapusBeritaButtonProps {
    slug: string;
}

export default function HapusBeritaButton({
    slug,
}: HapusBeritaButtonProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleDelete() {
        const confirmed = window.confirm(
            "Yakin ingin menghapus berita ini?"
        );

        if (!confirmed) return;

        setLoading(true);

        try {
            const response = await fetch(`/api/berita/${slug}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const data = await response.json();
                alert(data.message ?? "Gagal menghapus berita.");
                return;
            }

            router.refresh();
        } catch {
            alert("Terjadi kesalahan saat menghapus berita.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
            {loading ? "Menghapus..." : "Hapus"}
        </button>
    );
}