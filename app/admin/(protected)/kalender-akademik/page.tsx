import { db } from "@/prisma/db";
import Link from "next/link";
import KalenderAkademikList from "./components/KalenderAkademikList";

export default async function AdminKalenderAkademikPage() {
    const kalender = await db.orm.public.KalenderAkademik.all();

    return (
        <div className="space-y-8 pb-24 sm:pb-0">
            <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Kalender Akademik
                    </h1>
                    <p className="mt-1 text-sm text-slate-600">
                        Kelola jadwal kegiatan akademik Program Studi Magister
                        Manajemen.
                    </p>
                </div>

                <Link
                    href="/admin/kalender-akademik/tambah"
                    className="hidden items-center justify-center rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-800 sm:inline-flex"
                >
                    Tambah Kegiatan
                </Link>
            </section>

            <KalenderAkademikList kalender={kalender} />

            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-4px_16px_rgba(15,23,42,0.08)] backdrop-blur sm:hidden">
                <Link
                    href="/admin/kalender-akademik/tambah"
                    className="mx-auto flex w-full max-w-4xl items-center justify-center rounded-lg bg-blue-700 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-800"
                >
                    Tambah Kegiatan
                </Link>
            </div>
        </div>
    );
}
