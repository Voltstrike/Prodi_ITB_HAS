"use client";

import { FormEvent, useState } from "react";

export default function AdminLoginPage() {
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setError("");
        setLoading(true);

        const form = new FormData(event.currentTarget);

        const email = form.get("email")?.toString() ?? "";
        const password = form.get("password")?.toString() ?? "";

        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email,
                password,
            }),
        });

        const data = await response.json();

        setLoading(false);

        if (!response.ok) {
            setError(data.message ?? "Login gagal");
            return;
        }

        window.location.href = "/admin";
    }

    return (
        <main>
            <h1>Login Admin</h1>

            <form onSubmit={handleSubmit}>
                <div>
                    <label>Email</label>
                    <input
                        name="email"
                        type="email"
                        required
                    />
                </div>

                <div>
                    <label>Password</label>
                    <input
                        name="password"
                        type="password"
                        required
                    />
                </div>

                {error && <p>{error}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? "Memproses..." : "Login"}
                </button>
            </form>
        </main>
    );
}
