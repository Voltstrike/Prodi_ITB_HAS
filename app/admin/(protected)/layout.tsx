import { requireAdmin } from "@/lib/auth/require-admin";
import AdminNav from "./components/AdminNav";

export default async function ProtectedAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await requireAdmin();

    return (
        <>
            <AdminNav />
            {children}
        </>
    );
}