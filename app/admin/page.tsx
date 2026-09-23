import { requireAdmin } from "@/lib/auth/require-admin";

export default async function AdminPage() {
    const user = await requireAdmin();

    return(
        <main>
            <h1>Admin Dashboard</h1>
            <p>Panel administrasi Program Studi Magister Manajemen</p>
            <p>Login sebagai: {user.nama}</p>
        </main>
    );
}