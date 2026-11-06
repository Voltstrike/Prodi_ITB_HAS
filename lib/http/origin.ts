export function isSameOriginRequest(request: Request): boolean {
    const site = request.headers.get("sec-fetch-site");

    if (site === "cross-site" || site === "same-site") {
        return false;
    }

    const configured = process.env.APP_ORIGIN;
    const production = process.env.NODE_ENV === "production";

    if (production && configured === undefined) {
        return false;
    }

    let target: URL;

    try {
        const destination = new URL(request.url);

        if (!["http:", "https:"].includes(destination.protocol)) {
            return false;
        }

        target = configured === undefined
            ? destination
            : new URL(configured.trim());
    } catch {
        return false;
    }

    if (
        !["http:", "https:"].includes(target.protocol) ||
        (production && target.protocol !== "https:") ||
        (configured !== undefined && (
            target.username !== "" ||
            target.password !== "" ||
            target.pathname !== "/" ||
            target.search !== "" ||
            target.hash !== ""
        ))
    ) {
        return false;
    }

    const origin = request.headers.get("origin");

    if (origin !== null) {
        return origin === target.origin;
    }

    const referer = request.headers.get("referer");

    if (!referer) return false;

    try {
        const source = new URL(referer);
        return (
            ["http:", "https:"].includes(source.protocol) &&
            source.origin === target.origin
        );
    } catch {
        return false;
    }
}

export function requireSameOriginRequest(request: Request): Response | null {
    if (isSameOriginRequest(request)) return null;

    return Response.json(
        { message: "Origin tidak diizinkan" },
        { status: 403, headers: { "Cache-Control": "no-store" } },
    );
}
