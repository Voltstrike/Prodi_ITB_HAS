"use client";

import Image, { type ImageProps } from "next/image";
import { useState, type ReactNode } from "react";
import { parseImageSource } from "@/lib/images/source";

type Props = Pick<
    ImageProps,
    "alt" | "width" | "height" | "fill" | "sizes" | "className" | "unoptimized"
> & {
    src: string | null | undefined;
    fallbackSrc?: string;
    fallback?: ReactNode;
};

export default function ImageWithFallback({
    src, alt, fallbackSrc, fallback = null, unoptimized, ...imageProps
}: Props) {
    const [failedSources, setFailedSources] = useState<string[]>([]);
    const source = [parseImageSource(src), parseImageSource(fallbackSrc)].find(
        (candidate): candidate is string =>
            candidate !== null && !failedSources.includes(candidate),
    );

    if (!source) return <>{fallback}</>;

    return (
        <Image
            {...imageProps}
            key={source}
            src={source}
            alt={alt}
            unoptimized={unoptimized || !source.startsWith("/")}
            onError={() => setFailedSources((previous) =>
                previous.includes(source) ? previous : [...previous, source],
            )}
        />
    );
}
