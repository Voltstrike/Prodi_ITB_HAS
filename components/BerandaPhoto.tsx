import type { ReactNode } from "react";
import ImageWithFallback from "@/components/ImageWithFallback";

type Props = {
    src?: string | null;
    alt: string;
    emptyText: string;
    ratio?: "4/3" | "16/10";
    fallback?: ReactNode;
};

export default function BerandaPhoto({
    src,
    alt,
    emptyText,
    ratio = "4/3",
    fallback,
}: Props) {
    const isCard = ratio === "16/10";

    return (
        <div
            className={`relative w-full overflow-hidden bg-slate-200 ${
                isCard ? "aspect-16/10" : "aspect-4/3"
            }`}
        >
            <ImageWithFallback
                src={src}
                alt={alt}
                fill
                sizes={
                    isCard
                        ? "(max-width: 767px) 100vw, 33vw"
                        : "(max-width: 767px) 100vw, 50vw"
                }
                className="object-cover"
                fallback={
                    fallback ?? (
                        <div className="flex h-full w-full items-center justify-center p-6 text-center text-sm text-slate-600">
                            {emptyText}
                        </div>
                    )
                }
            />
        </div>
    );
}
