export function parseMataKuliahIds(value: unknown): number[] | null {
    if (!Array.isArray(value) || value.length > 100) {
        return null;
    }

    const ids = new Set<number>();

    for (const id of value) {
        if (
            typeof id !== "number" ||
            !Number.isInteger(id) ||
            id < 1 ||
            id > 2_147_483_647 ||
            ids.has(id)
        ) {
            return null;
        }

        ids.add(id);
    }

    return [...ids];
}
