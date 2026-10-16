export function parsePositiveInt32(value: unknown): number | null {
    if (typeof value !== "number" && typeof value !== "string") {
        return null;
    }

    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 2_147_483_647) {
        return null;
    }

    return parsed;
}
