import { profileAccreditation, profileDocumentUrl, profileParagraphs } from "@/lib/profil/presentation";

type Props = { akreditasi?: string | null; dokumen?: string | null };

export default function ProfileAccreditation({ akreditasi, dokumen }: Props) {
    const data = profileAccreditation(akreditasi);
    const document = profileDocumentUrl(dokumen);
    return <section id="akreditasi" aria-labelledby="profil-akreditasi-heading" className="scroll-mt-24 border-t border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-12 sm:py-16">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-blue-700">Penjaminan mutu</p>
            <h2 id="profil-akreditasi-heading" className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Akreditasi</h2>
            {data.text || document ? <div className="mt-8 grid overflow-hidden rounded-2xl border border-slate-200 bg-white md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.25fr)]">
                <div className="min-w-0 bg-blue-50 p-6 sm:p-8">
                    <p className="text-sm font-medium text-blue-800">Program Studi Magister Manajemen</p>
                    {data.grade && <p className="mt-5 text-sm font-semibold text-blue-800">Terakreditasi</p>}
                    <p className="mt-2 break-words text-3xl font-bold tracking-tight text-blue-950">{data.grade || "Informasi Akreditasi"}</p>
                    {data.year && <p className="mt-4 text-sm text-blue-800">Tahun keputusan {data.year}</p>}
                </div>
                <div className="flex min-w-0 flex-col justify-center p-6 sm:p-8">
                    {data.text && !data.statusOnly && <div className="space-y-4 text-base leading-8 text-slate-600">{profileParagraphs(data.text).map((part, index) => <p key={index} className="whitespace-pre-line break-words">{part}</p>)}</div>}
                    {(data.agency || data.decree) && <dl className="mt-5 space-y-4 border-t border-slate-100 pt-5">
                        {data.agency && <div><dt className="text-xs text-slate-500">Lembaga akreditasi</dt><dd className="mt-1 text-sm font-medium text-slate-900">{data.agency}</dd></div>}
                        {data.decree && <div><dt className="text-xs text-slate-500">Nomor surat keputusan</dt><dd className="mt-1 break-words text-sm font-medium text-slate-900">{data.decree}</dd></div>}
                    </dl>}
                    {document ? <div className={data.statusOnly || !data.text ? "" : "mt-6"}>
                        {(data.statusOnly || !data.text) && <h3 className="mb-4 text-base font-semibold text-slate-900">Dokumen Akreditasi</h3>}
                        <a href={document} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700">Lihat dokumen akreditasi</a>
                    </div> : data.statusOnly ? <p className="text-sm leading-7 text-slate-500">Dokumen akreditasi belum tersedia.</p> : null}
                    {!data.text && <p className="mt-4 text-sm leading-7 text-slate-500">Informasi akreditasi belum tersedia.</p>}
                </div>
            </div> : <p className="mt-6 text-base leading-8 text-slate-600">Informasi mengenai akreditasi Program Studi Magister Manajemen belum tersedia.</p>}
        </div>
    </section>;
}
