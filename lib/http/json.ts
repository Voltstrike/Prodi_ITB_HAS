export class RequestBodyTooLargeError extends Error {
    constructor() {
        super("Request body terlalu besar");
        this.name = "RequestBodyTooLargeError";
    }
}

export class InvalidJsonBodyError extends Error {
    constructor() {
        super("Request body bukan JSON yang valid");
        this.name = "InvalidJsonBodyError";
    }
}

export async function readJsonBody(
    request: Request,
    maxBytes: number
): Promise<unknown> {
    const contentLength = request.headers.get("content-length");

    if (contentLength) {
        const parsedLength = Number(contentLength);

        if (
            Number.isFinite(parsedLength) &&
            parsedLength > maxBytes
        ) {
            throw new RequestBodyTooLargeError();
        }
    }

    if (!request.body) {
        throw new InvalidJsonBodyError();
    }

    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;

    try {
        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                break;
            }

            totalBytes += value.byteLength;

            if (totalBytes > maxBytes) {
                await reader.cancel();
                throw new RequestBodyTooLargeError();
            }

            chunks.push(value);
        }
    } finally {
        reader.releaseLock();
    }

    const body = new Uint8Array(totalBytes);
    let offset = 0;

    for (const chunk of chunks) {
        body.set(chunk, offset);
        offset += chunk.byteLength;
    }

    const text = new TextDecoder().decode(body);

    try {
        return JSON.parse(text);
    } catch {
        throw new InvalidJsonBodyError();
    }
}

export type JsonObjectBodyResult =
    | {
          ok: true;
          body: Record<string, unknown>;
      }
    | {
          ok: false;
          response: Response;
      };

export async function readJsonObjectBody(
    request: Request,
    maxBytes: number
): Promise<JsonObjectBodyResult> {
    try {
        const body = await readJsonBody(request, maxBytes);

        if (
            !body ||
            typeof body !== "object" ||
            Array.isArray(body)
        ) {
            return {
                ok: false,
                response: Response.json(
                    { message: "Request body tidak valid" },
                    { status: 400 }
                ),
            };
        }

        return {
            ok: true,
            body: body as Record<string, unknown>,
        };
    } catch (error) {
        if (error instanceof RequestBodyTooLargeError) {
            return {
                ok: false,
                response: Response.json(
                    { message: "Request body terlalu besar" },
                    { status: 413 }
                ),
            };
        }

        if (error instanceof InvalidJsonBodyError) {
            return {
                ok: false,
                response: Response.json(
                    { message: "Request body tidak valid" },
                    { status: 400 }
                ),
            };
        }

        throw error;
    }
}
