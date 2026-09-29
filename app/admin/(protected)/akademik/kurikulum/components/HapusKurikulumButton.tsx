"use client";

interface HapusKurikulumButtonProps {
    id: number;
}

export default function HapusKurikulumButton({
    id,
}: HapusKurikulumButtonProps) {
    async function handleDelete() {
        const confirmed = window.confirm(
            "Yakin ingin menghapus mata kuliah ini?"
        );

        if (!confirmed) {
            return;
        }

        const response = await fetch(
            `/api/kurikulum/${id}`,
            {
                method: "DELETE",
            }
        );

        if (!response.ok) {
            const error = await response.json();

            alert(
                error.message ??
                    "Gagal menghapus mata kuliah"
            );

            return;
        }

        alert("Mata kuliah berhasil dihapus");

        window.location.reload();
    }

    return (
        <button type="button" onClick={handleDelete}>
            Hapus
        </button>
    );
}
