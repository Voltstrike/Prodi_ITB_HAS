"use client";

interface HapusStaffButtonProps {
    id: number;
}

export default function HapusStaffButton({
    id,
}: HapusStaffButtonProps) {
    async function handleDelete() {
        const yakin = window.confirm(
            "Yakin ingin menghapus data staff ini?"
        );

        if (!yakin) {
            return;
        }

        const response = await fetch(`/api/staff/${id}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            const error = await response.json();
            alert(error.message ?? "Gagal menghapus data staff");
            return;
        }

        alert("Data staff berhasil dihapus");
        window.location.href = "/admin/staff";
    }

    return (
        <button type="button" onClick={handleDelete}>
            Hapus
        </button>
    );
}
