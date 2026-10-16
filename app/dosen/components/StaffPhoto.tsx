"use client";

import Image from "next/image";
import { useState } from "react";
import { parseImageSource } from "@/lib/images/source";

const DEFAULT_PHOTO = "/dosen/default.jpg";

export default function StaffPhoto({ foto, nama }: {
    foto: string | null;
    nama: string;
}) {
    const source = parseImageSource(foto) ?? DEFAULT_PHOTO;
    const [failedSource, setFailedSource] = useState<string | null>(null);
    const src = failedSource === source ? DEFAULT_PHOTO : source;

    return (
        <Image
            src={src}
            alt={nama}
            width={200}
            height={200}
            unoptimized={!src.startsWith("/")}
            onError={() => setFailedSource(source)}
            className="h-48 w-48 rounded-lg object-cover"
        />
    );
}
