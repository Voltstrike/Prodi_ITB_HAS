export function isSameOriginRequest(request: Request): boolean {
    const site = request.headers.get("sec-fetch-site");

    if (site === "cross-site" || site === "same-site") {
        return false;
    }

    const target = new URL(request.url);
    if (!["http:", "https:"].includes(target.protocol)) {
        return false;
    }

    const origin = request.headers.get("origin");
    if (origin !== null) {
        return origin === target.origin;
    }

    const referer = request.headers.get("referer");
    if (!referer) {
        return false;
    }

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
    if (isSameOriginRequest(request)) {
        return null;
    }

    return Response.json(
        { message: "Origin tidak diizinkan" },
        { status: 403, headers: { "Cache-Control": "no-store" } },
    );
}
