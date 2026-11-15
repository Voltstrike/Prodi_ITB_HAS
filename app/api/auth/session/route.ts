import { getSessionTokenHash } from "@/lib/auth/session";
import {
    publicSessionState,
    readActiveAdminSession,
    recordAdminActivity,
} from "@/lib/auth/session-lifecycle";
import { readJsonObjectBody } from "@/lib/http/json";
import { requireSameOriginRequest } from "@/lib/http/origin";

function json(body: object, status = 200) {
    return Response.json(body, {
        status,
        headers: { "Cache-Control": "no-store" },
    });
}

function expired() {
    return json({ message: "Sesi berakhir. Silakan login kembali." }, 401);
}

export async function GET() {
    try {
        const tokenHash = await getSessionTokenHash();
        const state = tokenHash ? await readActiveAdminSession(tokenHash) : null;
        return state ? json(publicSessionState(state)) : expired();
    } catch (error) {
        console.error("SESSION STATUS ERROR:", error instanceof Error ? error.name : "UnknownError");
        return json({ message: "Status sesi gagal dibaca." }, 503);
    }
}

export async function POST(request: Request) {
    const originError = requireSameOriginRequest(request);
    if (originError) return originError;

    try {
        const tokenHash = await getSessionTokenHash();
        if (!tokenHash) return expired();

        const parsed = await readJsonObjectBody(request, 1024);
        if (!parsed.ok) {
            parsed.response.headers.set("Cache-Control", "no-store");
            return parsed.response;
        }

        const { sessionId } = parsed.body;
        if (
            Object.keys(parsed.body).length !== 1 ||
            typeof sessionId !== "number" ||
            !Number.isSafeInteger(sessionId) || sessionId <= 0
        ) return json({ message: "Identitas sesi tidak valid." }, 400);

        const result = await recordAdminActivity(tokenHash, sessionId);
        if (result.kind === "expired") return expired();
        if (result.kind === "changed") {
            return json({ message: "Sesi telah berganti. Muat ulang halaman." }, 409);
        }
        return json(result.state);
    } catch (error) {
        console.error("SESSION ACTIVITY ERROR:", error instanceof Error ? error.name : "UnknownError");
        return json({ message: "Aktivitas sesi gagal dicatat." }, 503);
    }
}
