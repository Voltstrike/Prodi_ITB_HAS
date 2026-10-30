import Link from "next/link";
import ImageWithFallback from "@/components/ImageWithFallback";

type Props = {
    item: {
        slug: string;
        judul: string;
        jenis: string;
        tahun: number;
        ringkasan: string;
        foto: string | null;
        dosen: { nama: string };
    };
};

export default function KegiatanCard({ item }: Props) {
    const fallback = (
        <div className="flex h-full items-center justify-center text-sm font-semibold tracking-wide text-blue-800">
            MM ITB HAS
        </div>
    );

    return (
        <article className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-blue-200 hover:shadow-md">
            <Link
                href={`/kegiatan-prodi/${encodeURIComponent(item.slug)}`}
                className="flex h-full flex-col focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-blue-600"
            >
                <div className="relative aspect-16/10 overflow-hidden bg-blue-50">
                    {item.foto?.trim() ? (
                        <ImageWithFallback
                            src={item.foto}
                            alt={item.judul}
                            fallback={fallback}
                            fill
                            unoptimized
                            sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
                            className="object-cover"
                        />
                    ) : fallback}
                </div>

                <div className="flex flex-1 flex-col p-5">
                    <p className="text-xs font-semibold text-blue-700">
                        {item.jenis === "PENELITIAN"
                            ? "Penelitian"
                            : "Pengabdian Masyarakat"}
                        {" · "}
                        {item.tahun}
                    </p>

                    <h3 className="mt-2 break-words text-lg font-semibold leading-snug text-slate-900 transition group-hover:text-blue-700">
                        {item.judul}
                    </h3>

                    <p className="mt-2 break-words text-sm text-slate-500">
                        Dosen: {item.dosen.nama}
                    </p>

                    <p className="mt-3 line-clamp-3 break-words text-sm leading-relaxed text-slate-600">
                        {item.ringkasan}
                    </p>

                    <span className="mt-auto block pt-5 text-sm font-semibold text-blue-700">
                        Lihat Kegiatan <span aria-hidden="true">→</span>
                    </span>
                </div>
            </Link>
        </article>
    );
}
