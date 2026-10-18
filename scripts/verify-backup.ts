import { lstat,  readFile, realpath } from "node:fs/promises";
import { join } from "node:path";
import { isMediaFileName } from "@/lib/media/constants";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";

async function hashFile(path: string): Promise<string> {
    const hash = createHash("sha256");

    for await (const chunk of createReadStream(path)) {
        hash.update(chunk);
    }

    return hash.digest("hex");
}

const argument = process.argv[2];

if (!argument || process.argv.length !== 3) {
    throw new Error("Sertakan tepat satu folder backup.");
}

const backupDirectory = await realpath(argument);
const manifestPath = join(backupDirectory, "manifest.json");

if (!(await lstat(manifestPath)).isFile()) {
    throw new Error("Manifest harus berupa berkas biasa.");
}

const manifest: unknown = JSON.parse(
    await readFile(manifestPath, "utf8"),
);
if (manifest === null || typeof manifest !== "object" || Array.isArray(manifest)) {
    throw new Error("Manifest harus berupa objek JSON.");
}

console.log("Manifest terbaca:", backupDirectory);
const data = manifest as Record<string, unknown>;

if (data.version !== 1 || data.database !== "mm_itbhas") {
    throw new Error("Versi atau nama database pada manifest tidak sesuai.");
}

if (!Array.isArray(data.files) || data.files.length === 0) {
    throw new Error("Daftar berkas backup tidak valid atau kosong.");
}

const files: { path: string; sha256: string }[] = [];

for (const entry of data.files as unknown[]) {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
        throw new Error("Entri berkas harus berupa objek.");
    }

    const file = entry as Record<string, unknown>;

    if (
        typeof file.path !== "string" ||
        typeof file.sha256 !== "string" ||
        file.sha256.length !== 64 ||
        /[^a-f0-9]/.test(file.sha256)
    ) {
        throw new Error("Path atau checksum berkas tidak valid.");
    }

    files.push({ path: file.path, sha256: file.sha256 });
}

const paths = new Set<string>();

for (const file of files) {
    const allowed = file.path === "database.dump" ||
        (file.path.startsWith("media/") &&
            isMediaFileName(file.path.slice(6)));

    if (!allowed || paths.has(file.path)) {
        throw new Error("Nama berkas tidak diizinkan atau terduplikasi.");
    }

    paths.add(file.path);
}

if (!paths.has("database.dump")) {
    throw new Error("Arsip database tidak tercatat dalam manifest.");
}

for (const file of files) {
    const filePath = join(backupDirectory, file.path);
    const info = await lstat(filePath);

    if (!info.isFile() || (await realpath(filePath)) !== filePath) {
        throw new Error(`Berkas tidak valid atau berupa tautan: ${file.path}`);
    }

    const actual = await hashFile(filePath);

    if (actual !== file.sha256) {
        throw new Error(`Checksum tidak sesuai: ${file.path}`);
    }
}

if (
    typeof data.contractSha256 !== "string" ||
    data.contractSha256.length !== 64 ||
    /[^a-f0-9]/.test(data.contractSha256)
) {
    throw new Error("Checksum kontrak pada manifest tidak valid.");
}

const contractHash = await hashFile("prisma/contract.json");

if (contractHash !== data.contractSha256) {
    throw new Error("Kontrak proyek berbeda dari kontrak paket backup.");
}

console.log("Kontrak proyek sesuai dengan paket backup.");
console.log(`Checksum cocok: ${files.length} berkas.`);
console.log("Identitas manifest sesuai.");
console.log("Berkas tercatat:", files.length);
console.log("Nama berkas sesuai dan tidak berulang.");
