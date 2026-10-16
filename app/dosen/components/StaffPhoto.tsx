"use client";

import ImageWithFallback from "@/components/ImageWithFallback";

export default function StaffPhoto({ foto, nama }: {
    foto: string | null;
    nama: string;
}) {
    return (
        <ImageWithFallback
            src={foto}
            fallbackSrc="/dosen/default.jpg"
            alt={nama}
            width={200}
            height={200}
            className="h-48 w-48 rounded-lg object-cover"
        />
    );
}
