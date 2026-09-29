"use client";

export default function LogoutButton() {
    async function handleLogout() {
        const response = await fetch("/api/auth/logout", {
            method: "POST",
        });

        if (!response.ok) {
            alert("Gagal logout");
            return;
        }

        window.location.href = "/admin/login";
    }

    return (
        <button type="button" onClick={handleLogout}>
            Logout
        </button>
    );
}
