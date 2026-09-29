import { requireAdmin } from "@/lib/auth/require-admin";
import LogoutButton from "./components/LogoutButton";

export default async function ProtectedAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await requireAdmin();

    return (
        <>
            <header>
                <LogoutButton />
            </header>

            {children}
        </>
    );
}