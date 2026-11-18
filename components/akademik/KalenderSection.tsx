"use client";

import { useState } from "react";
import { academicDateLabel, calendarActivity, isAcademicDate } from "@/lib/akademik/policy";

type Agenda = {
    id: number;
    kegiatan: string;
    tanggalMulai: string;
    tanggalSelesai: string;
    keterangan: string | null;
    semester: string | null;
    tahunAkademik: string | null;
};

const all = "Semua periode";
const legacy = "Belum ada periode";
const monthName = new Intl.DateTimeFormat("id-ID", {
    month: "long", year: "numeric", timeZone: "UTC",
});
const shortMonth = new Intl.DateTimeFormat("id-ID", {
    month: "short", timeZone: "UTC",
});
const labels = {
    UPCOMING: "Akan datang", ONGOING: "Berlangsung",
    FINISHED: "Selesai", UNKNOWN: "Jadwal belum pasti",
};
const badge = {
    UPCOMING: "bg-blue-50 text-blue-700",
    ONGOING: "bg-emerald-50 text-emerald-800",
    FINISHED: "bg-slate-100 text-slate-600",
    UNKNOWN: "bg-slate-100 text-slate-600",
};

function period(item: Agenda) {
    if (!item.semester || !item.tahunAkademik) return legacy;
    return (item.semester === "GANJIL" ? "Ganjil " : "Genap ") + item.tahunAkademik;
}

function DateBlock({ item }: { item: Agenda }) {
    const start = item.tanggalMulai;
    const end = item.tanggalSelesai || start;

    if (!isAcademicDate(start) || !isAcademicDate(end) || end < start) {
        return <span className="text-sm text-slate-600">
            {[start, end !== start && end].filter(Boolean).join(" – ") || "Belum tersedia"}
        </span>;
    }
    if (start.slice(0, 7) !== end.slice(0, 7)) {
        return <span className="text-xs leading-5 text-blue-700">
            {academicDateLabel(start)} – {academicDateLabel(end)}
        </span>;
    }
    return <>
        <span className="block text-xl leading-tight text-blue-700 sm:text-2xl">
            {Number(start.slice(-2))}{start !== end && "–" + Number(end.slice(-2))}
        </span>
        <span className="text-xs uppercase tracking-wider text-blue-700">
            {shortMonth.format(new Date(start + "T00:00:00Z"))}
        </span>
    </>;
}

export default function KalenderSection({ items, today }: { items: Agenda[]; today: string }) {
    const sorted = [...items].sort((a, b) =>
        a.tanggalMulai.localeCompare(b.tanggalMulai) || a.id - b.id);
    const periods = [...new Set([...sorted].reverse().map(period))];
    const active = sorted.find(item =>
        calendarActivity(item.tanggalMulai, item.tanggalSelesai, today) === "ONGOING");
    const [selected, setSelected] = useState(active && !periods.includes(legacy) ? period(active) : all);
    const chosen = periods.includes(selected) ? selected : all;
    const visible = sorted.filter(item => chosen === all || period(item) === chosen);

    const groups = new Map<string, Agenda[]>();
    for (const item of visible) {
        const key = isAcademicDate(item.tanggalMulai) ? item.tanggalMulai.slice(0, 7) : "~";
        const list = groups.get(key) ?? [];
        list.push(item);
        groups.set(key, list);
    }
    const months = [...groups.keys()].sort();
    const current = today.slice(0, 7);
    const firstOpen = months.find(m => m !== "~" && m >= current)
        ?? months.filter(m => m !== "~").at(-1) ?? "~";

    return <section id="kalender-akademik" aria-labelledby="judul-kalender"
        className="scroll-mt-24 bg-white text-slate-900">
        <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
            <div className="flex flex-col gap-5 pb-7 sm:flex-row sm:justify-between">
                <div>
                    <p className="text-xs font-semibold tracking-[0.16em] text-blue-700">JADWAL PERKULIAHAN</p>
                    <h2 id="judul-kalender" className="mt-3 text-2xl font-semibold">Kalender akademik</h2>
                    <p className="mt-2 text-sm text-slate-600">Agenda dikelompokkan per bulan agar mudah ditelusuri.</p>
                </div>
                <label className="text-sm text-slate-600">Periode akademik
                    <select value={chosen} onChange={event => setSelected(event.target.value)}
                        className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 sm:w-56">
                        {[all, ...periods].map(p => <option key={p}>{p}</option>)}
                    </select>
                </label>
            </div>

            <div key={chosen} className="border-y border-slate-200">
                {months.length === 0 && <p className="py-6 text-sm text-slate-600">
                    Belum ada agenda akademik yang diterbitkan.
                </p>}
                {months.map(month => {
                    const rows = groups.get(month)!;
                    const ongoing = rows.some(r =>
                        calendarActivity(r.tanggalMulai, r.tanggalSelesai, today) === "ONGOING");
                    return <details key={month} open={month === firstOpen || ongoing}
                        className="group border-b border-slate-200 last:border-0">
                        <summary className="flex cursor-pointer list-none items-center gap-2 py-5 marker:content-none [&::-webkit-details-marker]:hidden">
                            <span className="mr-auto font-medium">
                                {month === "~" ? "Tanggal belum ditentukan" :
                                    monthName.format(new Date(month + "-01T00:00:00Z"))}
                            </span>
                            {month === current && <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700">Bulan ini</span>}
                            <span className="text-xs text-slate-600">{rows.length} agenda</span>
                            <span aria-hidden="true" className="ml-1 text-blue-700 transition-transform group-open:rotate-90">›</span>
                        </summary>

                        <ul className="space-y-1 pb-5">
                            {rows.map(item => {
                                const status = calendarActivity(item.tanggalMulai, item.tanggalSelesai, today);
                                return <li key={item.id}
                                    className={"grid grid-cols-[4.5rem_minmax(0,1fr)] items-start gap-x-3 gap-y-2 border-b border-slate-200 px-2 py-4 last:border-0 sm:grid-cols-[6rem_minmax(0,1fr)_auto] sm:items-center sm:gap-x-5 sm:px-4 " +
                                        (status === "ONGOING" ? "rounded-lg border-transparent bg-blue-50" : "")}>
                                    <div className="border-r border-slate-200 pr-2 text-center">
                                        <DateBlock item={item} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="break-words font-semibold">{item.kegiatan}</h3>
                                        {item.keterangan && <p className="mt-1 whitespace-pre-line break-words text-sm leading-6 text-slate-600">
                                            {item.keterangan}
                                        </p>}
                                    </div>
                                    <span className={"col-start-2 w-fit rounded-full px-2.5 py-1 text-xs sm:col-start-auto " + badge[status]}>
                                        {labels[status]}
                                    </span>
                                </li>;
                            })}
                        </ul>
                    </details>;
                })}
            </div>
            <p aria-live="polite" className="mt-4 text-xs text-slate-600">{chosen} · {visible.length} agenda</p>
        </div>
    </section>;
}
