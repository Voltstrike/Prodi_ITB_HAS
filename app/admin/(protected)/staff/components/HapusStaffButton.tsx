"use client";

import { useRouter } from "next/navigation";

interface HapusStaffButtonProps {
    id: number;
}

export default function HapusStaffButton({
    id,
}: HapusStaffButtonProps) {
    const router = useRouter();

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
        router.push("/admin/staff");
        router.refresh();
    }

    return (
        <button type="button" onClick={handleDelete}>
            Hapus
        </button>
    );
}
