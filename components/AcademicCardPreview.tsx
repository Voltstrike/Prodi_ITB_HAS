import { db } from "@/prisma/db";
import { LANGKAH_PENDAFTARAN } from "@/lib/pendaftaran/constants";

export async function KalenderPreview() {
    const kalender = await db.orm.public.KalenderAkademik
        .select("id", "kegiatan", "tanggalMulai", "tanggalSelesai")
        .orderBy([
            (item) => item.createdAt.desc(),
            (item) => item.id.desc(),
        ])
        .limit(2)
        .all();

    return (
        <div className="absolute inset-0 flex flex-col justify-center overflow-hidden bg-blue-50 p-2.5 lg:p-5">
            <div className="flex items-center gap-2 text-blue-800">
                <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    className="h-4 w-4 shrink-0"
                >
                    <rect x="3" y="5" width="18" height="16" rx="2" />
                    <path
                        strokeLinecap="round"
                        d="M8 3v4M16 3v4M3 11h18"
                    />
                </svg>

                <p className="text-[10px] font-semibold uppercase leading-4 tracking-wide lg:text-xs">
                    Agenda Akademik
                </p>
            </div>

            {kalender.length > 0 ? (
                <ul className="mt-2 space-y-1.5 lg:mt-3 lg:space-y-2">
                    {kalender.map((item) => (
                        <li
                            key={item.id}
                            className="min-w-0 rounded-lg border border-blue-100 bg-white px-2 py-1 lg:px-3 lg:py-2"
                        >
                            <p className="truncate text-xs font-semibold leading-4 text-slate-900 lg:text-sm lg:leading-5">
                                {item.kegiatan}
                            </p>

                            <p className="truncate text-[11px] leading-4 text-slate-600 lg:text-xs">
                                {item.tanggalMulai}
                                {item.tanggalSelesai !== item.tanggalMulai &&
                                    ` – ${item.tanggalSelesai}`}
                            </p>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="mt-3 text-sm text-blue-900">
                    Jadwal akademik belum tersedia.
                </p>
            )}
        </div>
    );
}

export function PendaftaranPreview() {
    return (
        <div className="absolute inset-0 flex flex-col justify-center overflow-hidden bg-emerald-50 p-2.5 lg:p-5">
            <div className="flex items-center gap-2 text-emerald-800">
                <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    className="h-4 w-4 shrink-0"
                >
                    <rect x="5" y="3" width="14" height="18" rx="2" />
                    <path
                        strokeLinecap="round"
                        d="M9 8h6M9 12h6M9 16h3"
                    />
                </svg>

                <p className="text-[10px] font-semibold uppercase leading-4 tracking-wide lg:text-xs">
                    Alur Pendaftaran
                </p>
            </div>

            <ol className="mt-2 space-y-1.5 lg:mt-3 lg:space-y-2">
                {LANGKAH_PENDAFTARAN.map((item, index) => (
                    <li
                        key={item.judul}
                        className="flex min-w-0 items-center gap-2"
                    >
                        <span
                            aria-hidden="true"
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-bold text-emerald-800 lg:h-6 lg:w-6 lg:text-xs"
                        >
                            {index + 1}
                        </span>

                        <p className="truncate text-xs font-medium leading-4 text-emerald-950 lg:text-sm lg:leading-5">
                            {item.judul}
                        </p>
                    </li>
                ))}
            </ol>
        </div>
    );
}
