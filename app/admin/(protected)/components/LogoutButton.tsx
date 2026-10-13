"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
    const router = useRouter();

    async function handleLogout() {
        const response = await fetch("/api/auth/logout", {
            method: "POST",
        });

        if (!response.ok) {
            alert("Gagal logout");
            return;
        }

        router.replace("/admin/login");
        router.refresh();
    }

    return (
        <button type="button" onClick={handleLogout}>
            Logout
        </button>
    );
}
