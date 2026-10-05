import { db } from "@/prisma/db";
import Link from "next/link";
import DosenList from "./components/DosenList";

export default async function AdminDosenPage() {
    const dosen = await db.orm.public.Dosen.all();

    return (
        <div className="space-y-8">
            <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Data Dosen
                    </h1>

                    <p className="mt-1 text-sm text-slate-600">
                        Kelola data dosen Program Studi Magister Manajemen.
                    </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                    <Link
                        href="/admin/dosen/import"
                        className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                        Import Excel
                    </Link>

                    <Link
                        href="/admin/dosen/tambah"
                        className="inline-flex items-center justify-center rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-800"
                    >
                        Tambah Dosen
                    </Link>
                </div>
            </section>

            <DosenList dosen={dosen} />
        </div>
    );
}