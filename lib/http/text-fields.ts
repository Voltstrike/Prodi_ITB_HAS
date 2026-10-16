export function validateTextFieldTypes(
    body: Record<string, unknown>,
    fields: readonly string[],
): string | null {
    for (const field of fields) {
        const value = body[field];

        if (value !== undefined && value !== null && typeof value !== "string") {
            return `Field "${field}" harus berupa teks.`;
        }
    }

    return null;
}
