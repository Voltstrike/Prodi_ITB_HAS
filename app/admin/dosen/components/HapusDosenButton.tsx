"use client";

interface HapusDosenButtonProps {
    slug: string;
}

export default function HapusDosenButton({
    slug,
}: HapusDosenButtonProps) {
    async function handleDelete() {
        const yakin = window.confirm(
            "Yakin ingin menghapus data dosen ini?"
        );

        if (!yakin) {
            return;
        }

        const response = await fetch(`/api/dosen/${slug}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            const error = await response.json();
            alert(error.message ?? "Gagal menghapus data dosen");
            return;
        }

        alert("Data dosen berhasil dihapus");
        window.location.href = "/admin/dosen";
    }

    return (
        <button type="button" onClick={handleDelete}>
            Hapus
        </button>
    );
}