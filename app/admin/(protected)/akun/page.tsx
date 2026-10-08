import Link from "next/link";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { getAccountsPage } from "@/lib/admin/account-list";
import CreateAccountForm from "./components/CreateAccountForm";
import AccountTable from "./components/AccountTable";

export const dynamic = "force-dynamic";

export default async function AccountsPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string | string[] }>;
}) {
    const admin = await requireSuperAdmin();
    const query = await searchParams;
    const rawPage = typeof query.page === "string" ? query.page : "1";
    const { accounts, total, page, totalPages } =
        await getAccountsPage(rawPage);

    const linkClass =
        "rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700";

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-slate-900">
                    Kelola Akun
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                    Tambahkan akun admin dan kelola akses pengelola website.
                </p>
            </header>

            <CreateAccountForm />

            <AccountTable
                accounts={accounts}
                currentUserId={admin.id}
            />

            <nav
                aria-label="Navigasi halaman daftar akun"
                className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
                <p className="text-sm text-slate-500">
                    Menampilkan {accounts.length} dari {total} akun.
                    {" "}Halaman {page} dari {totalPages}.
                </p>

                {totalPages > 1 && (
                    <div className="flex gap-2">
                        {page > 1 ? (
                            <Link
                                href={`/admin/akun?page=${page - 1}`}
                                className={linkClass}
                            >
                                Sebelumnya
                            </Link>
                        ) : (
                            <span
                                aria-disabled="true"
                                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-400"
                            >
                                Sebelumnya
                            </span>
                        )}

                        {page < totalPages ? (
                            <Link
                                href={`/admin/akun?page=${page + 1}`}
                                className={linkClass}
                            >
                                Berikutnya
                            </Link>
                        ) : (
                            <span
                                aria-disabled="true"
                                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-400"
                            >
                                Berikutnya
                            </span>
                        )}
                    </div>
                )}
            </nav>
        </div>
    );
}
