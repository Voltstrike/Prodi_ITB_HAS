import { readFile } from "node:fs/promises";
import { createServer } from "node:http";

const html = await readFile(
    new URL("../ops/maintenance/index.html", import.meta.url),
);

const server = createServer((request, response) => {
    if (request.method !== "GET" && request.method !== "HEAD") {
        response.writeHead(405, {
            Allow: "GET, HEAD",
            "Cache-Control": "no-store",
        });
        response.end();
        return;
    }

    response.writeHead(503, {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Length": html.length,
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
        "X-Content-Type-Options": "nosniff",
    });
    response.end(request.method === "HEAD" ? undefined : html);
});

server.on("error", (error) => {
    console.error("Preview gagal:", error.message);
    process.exitCode = 1;
});

server.listen(18765, "127.0.0.1", () => {
    console.log("Preview maintenance: http://127.0.0.1:18765 (HTTP 503).");
    console.log("Tekan Ctrl+C untuk menutup preview.");
});
