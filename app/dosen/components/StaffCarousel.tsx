"use client";

import Image from "next/image";
import { useRef } from "react";

type Staff = {
  id: number;
  nama: string;
  pendidikan: string | null;
  jabatan: string;
  lingkupKerja: string | null;
  foto: string | null;
};

interface StaffCarouselProps {
  staff: Staff[];
}

export default function StaffCarousel({
  staff,
}: StaffCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);

  function scroll(direction: "left" | "right") {
    if (!carouselRef.current) return;

    const amount = carouselRef.current.clientWidth * 0.8;

    carouselRef.current.scrollBy({
      left: direction === "right" ? amount : -amount,
      behavior: "smooth",
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => scroll("left")}
        aria-label="Geser ke kiri"
        className="absolute left-0 top-1/2 z-10 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-xl text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        ←
      </button>

      <div
        ref={carouselRef}
        className="flex gap-6 overflow-x-auto scroll-smooth pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {staff.map((item) => (
          <article
            key={item.id}
            className="min-w-[280px] flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white sm:min-w-[320px] lg:min-w-[calc((100%-3rem)/3)]"
          >
            <div className="flex justify-center bg-slate-50 p-6">
              <Image
                src={item.foto || "/dosen/default.jpg"}
                alt={item.nama}
                width={200}
                height={200}
                className="h-48 w-48 rounded-lg object-cover"
              />
            </div>

            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-900">
                {item.nama}
              </h3>

              <p className="mt-2 text-sm font-medium text-blue-700">
                {item.jabatan}
              </p>

              <div className="mt-4 space-y-1 text-sm text-slate-600">
                <p>Pendidikan: {item.pendidikan || "-"}</p>
                <p>Lingkup Kerja: {item.lingkupKerja || "-"}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <button
        type="button"
        onClick={() => scroll("right")}
        aria-label="Geser ke kanan"
        className="absolute right-0 top-1/2 z-10 flex h-10 w-10 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-xl text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        →
      </button>
    </div>
  );
}