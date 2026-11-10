import { readFile, writeFile } from "node:fs/promises";

const templateUrl = new URL("../ops/maintenance/index.template.html", import.meta.url);
const logoUrl = new URL("../public/brand/logo-itbhas.png", import.meta.url);
const outputUrl = new URL("../ops/maintenance/index.html", import.meta.url);
const placeholder = "__PRODI_LOGO_DATA_URI__";

const template = await readFile(templateUrl, "utf8");
const logo = await readFile(logoUrl);

if (template.split(placeholder).length !== 2) {
    throw new Error("Placeholder logo harus muncul tepat satu kali.");
}

const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
if (!logo.subarray(0, 8).equals(pngSignature)) {
    throw new Error("Logo public/brand/logo-itbhas.png bukan berkas PNG.");
}

const html = template.replace(
    placeholder,
    `data:image/png;base64,${logo.toString("base64")}`,
);
const bytes = Buffer.byteLength(html, "utf8");

if (bytes > 1024 * 1024) {
    throw new Error("Halaman maintenance melebihi batas 1 MiB.");
}
if (/(?:src|href)\s*=\s*["']https?:\/\//i.test(html)) {
    throw new Error("Halaman maintenance masih mengambil aset eksternal.");
}

await writeFile(outputUrl, html, { mode: 0o644 });
console.log(
    `Halaman maintenance siap: ops/maintenance/index.html (${Math.ceil(bytes / 1024)} KiB).`,
);
