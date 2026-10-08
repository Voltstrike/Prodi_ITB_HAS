import { requireAdmin } from "@/lib/auth/require-admin";
import AdminNav from "./components/AdminNav";

export default async function ProtectedAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await requireAdmin();

    return (
        <div className="min-h-screen bg-slate-50 lg:flex">
            <AdminNav
                user={{
                    nama: user.nama,
                    email: user.email,
                    role: user.role,
                }}
            />

            <div className="min-w-0 flex-1">
                <main className="p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}