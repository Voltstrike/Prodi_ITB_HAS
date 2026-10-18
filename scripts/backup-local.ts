import "dotenv/config";
import { chmod, mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { mediaDirectory, readMedia } from "@/lib/media/storage";
import { isMediaFileName } from "@/lib/media/constants";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";

function run(command: string, args: string[], env = process.env): string {
    const result = spawnSync(command, args, {
        env,
        encoding: "utf8",
    });

    if (result.error || result.status !== 0 || result.stderr?.trim()) {
        throw new Error(
            `Perintah ${command} gagal atau menghasilkan peringatan.`,
        );
    }

    return result.stdout ?? "";
}

function escapePgPassField(value: string): string {
    if(["\n", "\r", "\0"].some((character) => value.includes(character))) {
        throw new Error("Konfigurasi koneksi mengandung karakter tidak valid.")
    }

    return value.replaceAll("\\", "\\\\").replaceAll(":", "\\:");
}

async function hashFile(path: string): Promise<string> {
    const hash = createHash("sha256");

    for await (const chunk of createReadStream(path)) {
        hash.update(chunk);
    }

    return hash.digest("hex");
}

let databaseUrl: URL;

try {
    databaseUrl = new URL(process.env.DATABASE_URL ?? "");
} catch {
    throw new Error("Konfigurasi DATABASE_URL tidak valid.");
}

if (
    !["postgres:", "postgresql:"].includes(databaseUrl.protocol) ||
    !["localhost", "127.0.0.1", "[::1]"].includes(databaseUrl.hostname) ||
    databaseUrl.pathname !== "/mm_itbhas"
) {
    throw new Error("Backup hanya diizinkan untuk mm_itbhas lokal.");
}

const pgHost = databaseUrl.hostname.replace(/^\[|\]$/g, "");
const pgPort = databaseUrl.port || "5432";
const pgUser = decodeURIComponent(databaseUrl.username);

const pgPassLine = [
    pgHost, pgPort, "mm_itbhas", pgUser,
    decodeURIComponent(databaseUrl.password),
].map(escapePgPassField).join(":") + "\n";

console.log("Konfigurasi database lokal valid.");

console.log(run("pg_dump", ["--version"]).trim());
console.log(run("pg_restore", ["--version"]).trim());

const backupRoot = join(homedir(), "backups", "mm_itbhas");

await mkdir(backupRoot, { recursive: true, mode: 0o700 });

const backupDirectory = await mkdtemp(join(backupRoot, "sync-"));
await chmod(backupDirectory, 0o700);

console.log("Folder backup:", backupDirectory);
const dumpPath = join(backupDirectory, "database.dump");
const credentialDirectory = await mkdtemp(join(tmpdir(), "mm-itbhas-pg-"));

try {
    const passFile = join(credentialDirectory, "pgpass");
    await writeFile(passFile, pgPassLine, { mode: 0o600, flag: "wx" });

    const pgEnv: NodeJS.ProcessEnv = { ...process.env, PGPASSFILE: passFile };
    delete pgEnv.PGPASSWORD;

    run("pg_dump", [
        "--host", pgHost, "--port", pgPort,
        "--username", pgUser, "--dbname", "mm_itbhas",
        "--no-password", "--format=custom", "--file", dumpPath,
    ], pgEnv);

    await chmod(dumpPath, 0o600);
    run("pg_restore", ["--file", "/dev/null", dumpPath], pgEnv);
} finally {
    await rm(credentialDirectory, { recursive: true, force: true });
}

console.log("Backup database selesai dan arsip terbaca:", dumpPath);

const mediaBackup = join(backupDirectory, "media");
await mkdir(mediaBackup, { mode: 0o700 });

const photoNames = (await readdir(mediaDirectory()))
    .filter(isMediaFileName)
    .sort();

for (const filename of photoNames) {
    const file = await readMedia(filename);

    if (!file?.data || file.data.length !== file.size) {
        throw new Error(`Foto ${filename} tidak dapat dicadangkan.`);
    }

    await writeFile(join(mediaBackup, filename), file.data, {
        mode: 0o600,
        flag: "wx",
    });
}

console.log("Foto dicadangkan:", photoNames.length);
const backupPaths = [
    "database.dump",
    ...photoNames.map((filename) => `media/${filename}`),
];

const backupFiles: { path: string; sha256: string }[] = [];

for (const relativePath of backupPaths) {
    backupFiles.push({
        path: relativePath,
        sha256: await hashFile(join(backupDirectory, relativePath)),
    });
}

const manifest = {
    version: 1,
    database: "mm_itbhas",
    createdAt: new Date().toISOString(),
    gitCommit: run("git", ["rev-parse", "HEAD"]).trim(),
    contractSha256: await hashFile("prisma/contract.json"),
    pgDumpVersion: run("pg_dump", ["--version"]).trim(),
    files: backupFiles,
};

await writeFile(
    join(backupDirectory, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
    { mode: 0o600, flag: "wx" },
);

console.log("Paket backup lengkap:", backupDirectory);
console.log("Berkas data tercatat:", backupFiles.length);