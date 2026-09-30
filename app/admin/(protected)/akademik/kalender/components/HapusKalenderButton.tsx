"use client";

interface HapusKalenderButtonProps {
    id: number;
}

export default function HapusKalenderButton({
    id,
}: HapusKalenderButtonProps) {
    async function handleDelete() {
        const confirmed = window.confirm(
            "Yakin ingin menghapus kegiatan kalender akademik ini?"
        );

        if (!confirmed) {
            return;
        }

        const response = await fetch(
            `/api/kalender-akademik/${id}`,
            {
                method: "DELETE",
            }
        );

        if (!response.ok) {
            const error = await response.json();

            alert(
                error.message ??
                    "Gagal menghapus kalender akademik"
            );

            return;
        }

        alert("Kalender akademik berhasil dihapus");

        window.location.reload();
    }

    return (
        <button type="button" onClick={handleDelete}>
            Hapus
        </button>
    );
}
