import {
    institutionalLabel, profileHistory, profileMission, purposeText,
    profileParagraphs,
} from "@/lib/profil/presentation";

type Props = { sejarah?: string | null; visi?: string | null; misi?: string | null };

function Paragraphs({ items }: { items: string[] }) {
    return items.map((text, index) => <p key={index} className="whitespace-pre-line break-words">{text}</p>);
}

export default function ProfileOverview({ sejarah, visi, misi }: Props) {
    const history = profileHistory(sejarah);
    const mission = profileMission(misi);
    const vision = profileParagraphs(purposeText(visi, "Visi"));
    const institutionVision = institutionalLabel(visi, "Visi");
    const institutionMission = institutionalLabel(misi, "Misi");
    const institution = institutionVision && institutionMission;
    return <>
        <section id="sejarah" aria-labelledby="profil-sejarah-heading" className="scroll-mt-24 bg-white">
            <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
                <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.35fr)] lg:gap-14">
                    <header className="min-w-0">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-blue-700">Jejak perjalanan</p>
                        <h2 id="profil-sejarah-heading" className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Sejarah Program Studi</h2>
                        <p className="mt-5 whitespace-pre-line break-words text-base leading-8 text-slate-600">{history.intro || "Informasi mengenai sejarah program studi belum tersedia."}</p>
                    </header>
                    {history.events.length > 0 && <ol aria-label="Tonggak sejarah" className="min-w-0">
                        {history.events.map((event, index) => <li key={event.year} className="grid grid-cols-[3rem_1rem_minmax(0,1fr)] gap-x-3 sm:gap-x-4">
                            <span className="pt-0.5 text-sm font-semibold text-blue-700">{event.year}</span>
                            <span aria-hidden="true" className="relative flex justify-center">
                                <span className="relative z-10 mt-2 h-2.5 w-2.5 rounded-full bg-blue-600" />
                                {index < history.events.length - 1 && <span className="absolute bottom-0 top-6 w-px bg-slate-200" />}
                            </span>
                            <div className={index < history.events.length - 1 ? "min-w-0 pb-7" : "min-w-0"}>
                                <h3 className="text-base font-semibold text-slate-900">{event.title}</h3>
                                <p className="mt-2 whitespace-pre-line break-words text-sm leading-7 text-slate-600">{event.text}</p>
                            </div>
                        </li>)}
                    </ol>}
                </div>
                {history.paragraphs.length > 0 && <details className="mt-8 border-t border-slate-200 pt-4">
                    <summary className="cursor-pointer rounded-sm py-2 text-sm font-semibold text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700">Baca sejarah lengkap</summary>
                    <div className="mt-5 columns-1 text-base leading-8 text-slate-600 lg:columns-2 lg:gap-x-12 [&>p]:mb-5 [&>p]:break-inside-avoid-column"><Paragraphs items={history.paragraphs} /></div>
                </details>}
            </div>
        </section>
        <section id="visi-misi" aria-labelledby="profil-visi-misi-heading" className="scroll-mt-24 border-y border-slate-100 bg-slate-50">
            <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-blue-700">Arah dan komitmen</p>
                <h2 id="profil-visi-misi-heading" className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Visi &amp; Misi{institution ? " ITB HAS" : ""}</h2>
                <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.45fr)]">
                    <article aria-labelledby="profil-visi-heading" className="min-w-0 rounded-2xl border border-blue-100 bg-blue-50 p-6 sm:p-8">
                        <h3 id="profil-visi-heading" className="text-base font-semibold text-blue-900">Visi{institutionVision && !institution ? " ITB HAS" : ""}</h3>
                        <div className="mt-4 space-y-5 text-lg font-medium leading-8 text-blue-950"><Paragraphs items={vision.length ? vision : ["Visi belum tersedia."]} /></div>
                    </article>
                    <article aria-labelledby="profil-misi-heading" className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
                        <h3 id="profil-misi-heading" className="text-base font-semibold text-slate-900">Misi{institutionMission && !institution ? " ITB HAS" : ""}</h3>
                        {mission.intro.length > 0 && <div className="mt-4 space-y-4 text-base leading-8 text-slate-600"><Paragraphs items={mission.intro} /></div>}
                        {mission.items.length > 0 ? <ol className="mt-4 divide-y divide-slate-100">
                            {mission.items.map((item) => <li key={item.marker} className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-3 py-4 first:pt-0 last:pb-0">
                                <span aria-hidden="true" className="pt-0.5 text-sm font-semibold text-blue-700">{item.marker}.</span>
                                <p className="whitespace-pre-line break-words text-base leading-8 text-slate-600">{item.text}</p>
                            </li>)}
                        </ol> : <div className="mt-4 space-y-5 text-base leading-8 text-slate-600"><Paragraphs items={mission.fallback.length ? mission.fallback : ["Misi belum tersedia."]} /></div>}
                    </article>
                </div>
            </div>
        </section>
    </>;
}
