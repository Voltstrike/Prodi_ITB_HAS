import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";
import AccountProfileForm from "./components/AccountProfileForm";

export const dynamic = "force-dynamic";

export default async function AccountProfilePage() {
    const user = await requireAdmin();

    return (
        <div className="mx-auto max-w-3xl space-y-8">
            <section>
                <Link
                    href="/admin"
                    className="text-sm font-medium text-blue-700 hover:text-blue-800"
                >
                    ← Kembali ke Dashboard
                </Link>

                <h1 className="mt-4 text-2xl font-bold text-slate-900">
                    Edit Profil Akun
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                    Perbarui nama tampilan dan email untuk login.
                </p>
            </section>

            <AccountProfileForm
                profile={{
                    nama: user.nama,
                    email: user.email,
                    role: user.role,
                }}
            />
        </div>
    );
}
