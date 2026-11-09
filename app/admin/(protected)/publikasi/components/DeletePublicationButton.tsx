"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeletePublicationButton({
    id,
    judul,
}: {
    id: number;
    judul: string;
}) {
    const router = useRouter();
    const [pending, setPending] = useState(false);
    const [error, setError] = useState("");

    async function remove() {
        if (pending) return;
        if (!window.confirm(
            `Hapus "${judul}" dari katalog website? Publikasi di sumber asal tetap tersedia.`,
        )) return;

        setPending(true);
        setError("");

        try {
            const response = await fetch(`/api/admin/publikasi/${id}`, {
                method: "DELETE",
                credentials: "same-origin",
            });

            if (!response.ok) {
                setError("Gagal menghapus publikasi. Muat ulang atau coba lagi.");
                return;
            }

            router.refresh();
        } catch {
            setError("Tidak dapat menghubungi server.");
        } finally {
            setPending(false);
        }
    }

    return (
        <div>
            <button
                type="button"
                disabled={pending}
                onClick={remove}
                aria-label={`Hapus publikasi ${judul}`}
                className="rounded px-2 py-1 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
                {pending ? "Menghapus…" : "Hapus"}
            </button>
            {error && (
                <p role="alert" className="mt-2 max-w-60 text-xs text-red-700">
                    {error}
                </p>
            )}
        </div>
    );
}
