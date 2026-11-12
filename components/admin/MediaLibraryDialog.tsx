"use client";

import { useEffect, useId, useRef } from "react";
import MediaLibraryBrowser from "./MediaLibraryBrowser";
import type { MediaLibraryItem } from "@/lib/media/library-list";

type Props = {
    onSelect: (item: MediaLibraryItem) => void;
    onCancel: () => void;
};

export default function MediaLibraryDialog({
    onSelect,
    onCancel,
}: Props) {
    const ref = useRef<HTMLDialogElement>(null);
    const id = useId();

    useEffect(() => {
        const dialog = ref.current;

        if (dialog && !dialog.open) {
            dialog.showModal();
        }

        return () => {
            if (dialog?.open) dialog.close();
        };
    }, []);

    return (
        <dialog
            ref={ref}
            aria-labelledby={`${id}-title`}
            onCancel={(event) => {
                event.preventDefault();
                onCancel();
            }}
            onKeyDown={(event) => {
                if (
                    event.key === "Enter" &&
                    event.target instanceof HTMLInputElement
                ) {
                    event.preventDefault();
                }
            }}
            className="m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-5xl overflow-y-auto rounded-xl border-0 bg-white p-5 text-slate-900 shadow-xl backdrop:bg-slate-900/60"
        >
            <div className="mb-4 flex items-center justify-between gap-4">
                <h2
                    id={`${id}-title`}
                    className="text-lg font-semibold"
                >
                    Pilih gambar dari pustaka
                </h2>

                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                    Batal
                </button>
            </div>

            <MediaLibraryBrowser onSelect={onSelect} />
        </dialog>
    );
}
