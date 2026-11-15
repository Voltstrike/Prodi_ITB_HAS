import { redirect } from "next/navigation";
import { getSessionTokenHash } from "@/lib/auth/session";
import { publicSessionState, readActiveAdminSession } from "@/lib/auth/session-lifecycle";
import AdminSessionGuard from "@/components/admin/AdminSessionGuard";
import AdminNav from "./components/AdminNav";

export default async function ProtectedAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const tokenHash = await getSessionTokenHash();
    const state = tokenHash ? await readActiveAdminSession(tokenHash) : null;
    if (!state) redirect("/admin/login");
    const user = state.user;

    return (
        <div className="min-h-screen bg-slate-50 lg:flex">
            <AdminSessionGuard key={state.session.id} initial={publicSessionState(state)} />
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