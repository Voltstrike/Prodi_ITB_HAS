export function parseImageSource(value: unknown): string | null {
    if (typeof value !== "string") return null;

    const source = value.trim();
    const hasControlCharacter = [...source].some((character) => {
        const code = character.charCodeAt(0);
        return code < 32 || code === 127;
    });

    if (!source || source.includes("\\") || hasControlCharacter) return null;

    const local = source.startsWith("/") && !source.startsWith("//");
    if (!local && !/^https?:\/\//i.test(source)) return null;

    try {
        const url = new URL(source, "https://image-source.invalid");
        if (
            !["http:", "https:"].includes(url.protocol) ||
            url.username || url.password
        ) return null;

        return local ? `${url.pathname}${url.search}${url.hash}` : url.href;
    } catch {
        return null;
    }
}
