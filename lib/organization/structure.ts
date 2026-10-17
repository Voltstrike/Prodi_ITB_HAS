export const MAX_ORGANIZATION_NODES = 50;
export const MAX_ORGANIZATION_DEPTH = 8;
export const MAX_POSITION_LENGTH = 150;

export type OrganizationPersonRef = {
    type: "dosen" | "staff";
    id: number;
};

export type OrganizationPerson = OrganizationPersonRef & {
    nama: string;
};

export type OrganizationNode = {
    id: string;
    jabatan: string;
    person: OrganizationPersonRef | null;
    parentId: string | null;
};

export type OrganizationStructure = {
    version: 1;
    nodes: OrganizationNode[];
};

type ValidationResult =
    | { ok: true; value: OrganizationStructure }
    | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]) {
    return Object.keys(value).every((key) => keys.includes(key));
}

function validKey(value: unknown): value is string {
    return typeof value === "string" && value.length > 0 && value.length <= 64 &&
        !/[^A-Za-z0-9_-]/.test(value);
}

export function organizationPersonKey(person: OrganizationPersonRef): string {
    return `${person.type}:${person.id}`;
}

export function validateOrganizationStructure(value: unknown): ValidationResult {
    const fail = (error: string): ValidationResult => ({ ok: false, error });

    if (
        !isRecord(value) ||
        !hasOnlyKeys(value, ["version", "nodes"]) ||
        value.version !== 1 ||
        !Array.isArray(value.nodes)
    ) {
        return fail("Format struktur organisasi tidak valid.");
    }

    if (value.nodes.length > MAX_ORGANIZATION_NODES) {
        return fail(`Struktur organisasi maksimal ${MAX_ORGANIZATION_NODES} jabatan.`);
    }

    const nodes: OrganizationNode[] = [];
    const byId = new Map<string, OrganizationNode>();

    for (const [index, entry] of value.nodes.entries()) {
        const label = `Jabatan ke-${index + 1}`;

        if (
            !isRecord(entry) ||
            !hasOnlyKeys(entry, ["id", "jabatan", "person", "parentId"]) ||
            !validKey(entry.id) ||
            typeof entry.jabatan !== "string" ||
            !(entry.parentId === null || validKey(entry.parentId))
        ) {
            return fail(`${label}: format isian tidak valid.`);
        }

        const jabatan = entry.jabatan.trim();

        if (!jabatan || jabatan.length > MAX_POSITION_LENGTH) {
            return fail(`${label}: nama jabatan wajib diisi, maksimal ${MAX_POSITION_LENGTH} karakter.`);
        }

        if (byId.has(entry.id)) {
            return fail("Ada ID jabatan yang digunakan lebih dari sekali.");
        }

        let person: OrganizationPersonRef | null = null;

        if (entry.person !== null) {
            if (
                !isRecord(entry.person) ||
                !hasOnlyKeys(entry.person, ["type", "id"]) ||
                (entry.person.type !== "dosen" && entry.person.type !== "staff") ||
                typeof entry.person.id !== "number" ||
                !Number.isSafeInteger(entry.person.id) ||
                entry.person.id <= 0 ||
                entry.person.id > 2_147_483_647
            ) {
                return fail(`${label}: pilih orang dari data Dosen atau Staff.`);
            }

            person = {
                type: entry.person.type as "dosen" | "staff",
                id: entry.person.id,
            };
        }

        const node: OrganizationNode = {
            id: entry.id,
            jabatan,
            person,
            parentId: entry.parentId,
        };

        nodes.push(node);
        byId.set(node.id, node);
    }

    for (const node of nodes) {
        if (node.parentId === node.id) {
            return fail(`Jabatan "${node.jabatan}" tidak dapat menjadi atasannya sendiri.`);
        }

        if (node.parentId !== null && !byId.has(node.parentId)) {
            return fail(`Atasan untuk jabatan "${node.jabatan}" tidak ditemukan.`);
        }
    }

    for (const node of nodes) {
        const seen = new Set<string>();
        let current: OrganizationNode | undefined = node;
        let depth = 0;

        while (current) {
            if (seen.has(current.id)) {
                return fail("Hubungan atasan membentuk lingkaran. Periksa susunan jabatan.");
            }

            seen.add(current.id);
            depth += 1;

            if (depth > MAX_ORGANIZATION_DEPTH) {
                return fail(`Struktur organisasi maksimal ${MAX_ORGANIZATION_DEPTH} tingkat.`);
            }

            current = current.parentId === null
                ? undefined
                : byId.get(current.parentId);
        }
    }

    if (
        nodes.length > 0 &&
        nodes.filter((node) => node.parentId === null).length !== 1
    ) {
        return fail('Pilih tepat satu jabatan tertinggi dengan atasan "Tidak ada".');
    }

    return { ok: true, value: { version: 1, nodes } };
}

export function availableOrganizationParents(
    nodes: readonly OrganizationNode[],
    nodeId: string,
): OrganizationNode[] {
    const excluded = new Set([nodeId]);
    let changed = true;

    while (changed) {
        changed = false;

        for (const node of nodes) {
            if (
                node.parentId !== null &&
                excluded.has(node.parentId) &&
                !excluded.has(node.id)
            ) {
                excluded.add(node.id);
                changed = true;
            }
        }
    }

    return nodes.filter((node) => !excluded.has(node.id));
}
