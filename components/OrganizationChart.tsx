"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
    organizationPersonKey,
    validateOrganizationStructure,
    type OrganizationNode,
    type OrganizationPerson,
    type OrganizationStructure,
} from "@/lib/organization/structure";
import styles from "./OrganizationChart.module.css";

type Props = {
    structure: OrganizationStructure;
    people: readonly OrganizationPerson[];
};

export default function OrganizationChart({ structure, people }: Props) {
    const result = validateOrganizationStructure(structure);
    const viewportRef = useRef<HTMLDivElement>(null);
    const layoutKey = result.ok
        ? result.value.nodes.map((node) => `${node.id}:${node.parentId ?? ""}`).join("|")
        : "";

    useEffect(() => {
        if (!layoutKey) return;
        const viewport = viewportRef.current;
        if (!viewport) return;

        function center() {
            if (viewport) {
                viewport.scrollLeft = Math.max(
                    0,
                    (viewport.scrollWidth - viewport.clientWidth) / 2,
                );
            }
        }

        center();
        const observer = typeof ResizeObserver === "undefined"
            ? null
            : new ResizeObserver(center);
        observer?.observe(viewport);
        return () => observer?.disconnect();
    }, [layoutKey]);

    if (!result.ok || result.value.nodes.length === 0) {
        return (
            <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                Struktur organisasi belum tersedia.
            </p>
        );
    }

    const names = new Map(
        people.map((person) => [organizationPersonKey(person), person.nama]),
    );
    const children = new Map<string | null, OrganizationNode[]>();

    for (const node of result.value.nodes) {
        const siblings = children.get(node.parentId) ?? [];
        siblings.push(node);
        children.set(node.parentId, siblings);
    }

    function renderNode(node: OrganizationNode, nested: boolean): ReactNode {
        const reports = children.get(node.id) ?? [];
        const nama = node.person
            ? names.get(organizationPersonKey(node.person))
            : null;

        return (
            <li
                key={node.id}
                className={`${styles.node} ${nested ? styles.branch : ""}`}
            >
                <div className={styles.card}>
                    <p className={styles.position}>{node.jabatan}</p>
                    <p className={`${styles.name} ${!nama ? styles.vacant : ""}`}>
                        {nama || "Belum ditetapkan"}
                    </p>
                </div>

                {reports.length > 0 && (
                    <ul className={styles.children}>
                        {reports.map((report) => renderNode(report, true))}
                    </ul>
                )}
            </li>
        );
    }

    return (
        <div>
            <p className="mb-3 text-xs text-slate-500 sm:hidden">
                Geser bagan ke samping untuk melihat seluruh susunan.
            </p>

            <div
                ref={viewportRef}
                role="region"
                aria-label="Bagan struktur organisasi"
                tabIndex={0}
                className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/60 p-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 sm:p-6"
            >
                <ul className={styles.root}>
                    {(children.get(null) ?? []).map((node) =>
                        renderNode(node, false),
                    )}
                </ul>
            </div>
        </div>
    );
}
