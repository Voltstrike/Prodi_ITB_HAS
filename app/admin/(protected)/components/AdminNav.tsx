import Link from "next/link";
import LogoutButton from "./LogoutButton";

export default function AdminNav() {
    return (
        <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                <div>
                    <Link
                        href="/admin"
                        className="text-lg font-bold text-slate-900"
                    >
                        Admin Magister Manajemen
                    </Link>
                </div>

                <nav className="flex items-center gap-4">
                    <Link
                        href="/admin"
                        className="text-sm font-medium text-slate-600 hover:text-blue-700"
                    >
                        Dashboard
                    </Link>

                    <Link
                        href="/admin/dosen"
                        className="text-sm font-medium text-slate-600 hover:text-blue-700"
                    >
                        Dosen
                    </Link>

                    <Link
                        href="/admin/staff"
                        className="text-sm font-medium text-slate-600 hover:text-blue-700"
                    >
                        Staff
                    </Link>

                    <Link
                        href="/admin/berita"
                        className="text-sm font-medium text-slate-600 hover:text-blue-700"
                    >
                        Berita
                    </Link>

                    <LogoutButton />
                </nav>
            </div>
        </header>
    );
}
