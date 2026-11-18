import { academicSummary } from "@/lib/akademik/policy";

type Info = {
    id: number;
    judul: string;
    deskripsi: string;
    status: string;
    utama: boolean;
    diterbitkanPada: string | null;
    createdAt: string;
};

const dateFormat = new Intl.DateTimeFormat("id-ID", {
    day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta",
});

const linkStyle = "w-fit cursor-pointer list-none rounded text-sm font-semibold text-blue-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700 [&::-webkit-details-marker]:hidden";

type Publication = Pick<Info, "diterbitkanPada" | "createdAt">;

function published(item: Publication) {
    return item.diterbitkanPada ?? item.createdAt;
}

export function PublishDate({ item }: { item: Publication }) {
    const date = new Date(published(item));
    return <time dateTime={date.toISOString()} className="text-xs font-medium text-slate-600">
        {dateFormat.format(date)}
    </time>;
}

function Body({ text }: { text: string }) {
    const summary = academicSummary(text);
    const full = text.trim();

    if (full.replace(/\s+/g, " ") === summary) {
        return <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-slate-600">
            {full}
        </p>;
    }

    return <div className="mt-2 text-sm leading-6 text-slate-600 [&:has(details[open])>p]:hidden">
        <p className="break-words">{summary}</p>
        <details className="group/story mt-3">
            <summary className={linkStyle}>
                <span className="group-open/story:hidden">
                    Baca selengkapnya <span aria-hidden="true">→</span>
                </span>
                <span className="hidden group-open/story:inline">
                    Tutup uraian <span aria-hidden="true">↑</span>
                </span>
            </summary>
            <p className="mt-3 whitespace-pre-line break-words">{full}</p>
        </details>
    </div>;
}

function NewsRows({ items }: { items: Info[] }) {
    return <ul className="divide-y divide-slate-200">
        {items.map(item => <li key={item.id} id={`pengumuman-${item.id}`}
            className="scroll-mt-24 grid gap-2 py-6 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-5">
            <div><PublishDate item={item} /></div>
            <article className="min-w-0">
                <h3 className="break-words font-semibold text-slate-900">{item.judul}</h3>
                <Body text={item.deskripsi} />
            </article>
        </li>)}
    </ul>;
}

export default function InformasiSection({ items }: { items: Info[] }) {
    const sorted = items.filter(item => item.status === "PUBLISHED").sort((a, b) =>
        Date.parse(published(b)) - Date.parse(published(a)) || b.id - a.id);
    const main = sorted.find(item => item.utama);
    const others = sorted.filter(item => item.id !== main?.id);

    return <section id="informasi-akademik" aria-labelledby="judul-informasi"
        className="scroll-mt-24 border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
            <p className="text-xs font-semibold tracking-[0.16em] text-blue-700">
                PENGUMUMAN PROGRAM STUDI
            </p>
            <h2 id="judul-informasi" className="mt-3 text-2xl font-semibold text-slate-900">
                Informasi akademik
            </h2>
            <p className="mt-2 text-sm text-slate-600">
                Pengumuman penting dan pembaruan untuk mahasiswa.
            </p>

            {main && <article id={`pengumuman-${main.id}`} className="scroll-mt-24 mt-7 flex items-start gap-3 rounded-xl border border-slate-200 border-l-4 border-l-blue-700 bg-white p-5 sm:gap-5 sm:p-7">
                <span aria-hidden="true" className="hidden size-10 shrink-0 place-items-center rounded-lg bg-blue-50 sm:grid">📌</span>
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                            Informasi utama
                        </span>
                        <PublishDate item={main} />
                    </div>
                    <h3 className="mt-3 break-words text-xl font-semibold text-slate-900">{main.judul}</h3>
                    <Body text={main.deskripsi} />
                </div>
            </article>}

            {others.length > 0 && <div className="mt-5">
                <NewsRows items={others.slice(0, 5)} />
                {others.length > 5 && <details className="group/list border-t border-slate-200 pt-4">
                    <summary className={linkStyle}>
                        <span className="group-open/list:hidden">Lihat {others.length - 5} pengumuman lainnya ↓</span>
                        <span className="hidden group-open/list:inline">Tutup daftar tambahan ↑</span>
                    </summary>
                    <NewsRows items={others.slice(5)} />
                </details>}
            </div>}

            {sorted.length === 0 && <p className="mt-7 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
                Belum ada pengumuman akademik yang diterbitkan.
            </p>}
        </div>
    </section>;
}
