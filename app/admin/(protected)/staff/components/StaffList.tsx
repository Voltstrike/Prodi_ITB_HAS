"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import HapusStaffButton from "./HapusStaffButton";

type Staff = {
    id: number;
    nama: string;
    pendidikan: string | null;
    jabatan: string;
    lingkupKerja: string | null;
};

export default function StaffList({ staff }: { staff: Staff[] }) {
    const [search, setSearch] = useState("");

    const filteredStaff = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        if (!keyword) return staff;

        return staff.filter(
            (item) =>
                item.nama.toLowerCase().includes(keyword) ||
                item.jabatan.toLowerCase().includes(keyword) ||
                (item.lingkupKerja ?? "").toLowerCase().includes(keyword),
        );
    }, [staff, search]);

    return (
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="font-semibold text-slate-900">
                            Daftar Staff
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            {filteredStaff.length} dari {staff.length} data
                            staff.
                        </p>
                    </div>

                    <div className="w-full sm:w-72">
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Cari nama, jabatan, atau lingkup..."
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                </div>
            </div>

            {filteredStaff.length === 0 ? (
                <div className="px-6 py-12 text-center">
                    <p className="text-sm text-slate-500">
                        Tidak ada data yang sesuai dengan pencarian.
                    </p>
                </div>
            ) : (
                <div className="divide-y divide-slate-100">
                    {filteredStaff.map((item) => (
                        <article
                            key={item.id}
                            className="flex flex-col gap-5 px-6 py-5 lg:flex-row lg:items-center lg:justify-between"
                        >
                            <div className="min-w-0">
                                <h3 className="font-semibold text-slate-900">
                                    {item.nama}
                                </h3>

                                <p className="mt-1 text-sm font-medium text-blue-700">
                                    {item.jabatan}
                                </p>

                                <div className="mt-3 grid gap-x-8 gap-y-1 text-sm text-slate-600 sm:grid-cols-2">
                                    <p>
                                        <span className="font-medium text-slate-700">
                                            Pendidikan:
                                        </span>{" "}
                                        {item.pendidikan ?? "-"}
                                    </p>

                                    <p>
                                        <span className="font-medium text-slate-700">
                                            Lingkup Kerja:
                                        </span>{" "}
                                        {item.lingkupKerja ?? "-"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                                <Link
                                    href={`/admin/staff/${item.id}`}
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                >
                                    Edit
                                </Link>

                                <HapusStaffButton id={item.id} />
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}
