export function profileParagraphs(value?: string | null): string[] {
    return (value || "").trim().replace(/\r\n?/g, "\n")
        .split(/\n[\t ]*\n+/).map((part) => part.trim()).filter(Boolean);
}

export type HistoryEvent = { year: number; title: string; text: string };

function eventTitle(text: string): string {
    if (/izin operasional/i.test(text)) return "Izin operasional program studi";
    if (/bertransformasi|transformasi kelembagaan|berubah bentuk/i.test(text)) return "Transformasi kelembagaan";
    if (/akreditasi/i.test(text)) {
        const grade = /\b(Baik Sekali|Unggul|Baik)\b/i.exec(text)?.[1];
        if (grade) return "Akreditasi " + grade.replace(/\b\w/g, (letter) => letter.toUpperCase());
        const letter = /(?:akreditasi|peringkat)\s+([ABC])\b(?![./])/i.exec(text)?.[1];
        return letter ? "Akreditasi " + letter.toUpperCase() : "Pencapaian akreditasi";
    }
    if (/yayasan/i.test(text) && /berdiri/i.test(text)) return "Pendirian yayasan";
    if (/STIE/i.test(text) && /menyelenggarakan pendidikan/i.test(text)) return "Penyelenggaraan pendidikan tinggi";
    return "Perkembangan institusi";
}

export function profileHistory(value?: string | null) {
    const paragraphs = profileParagraphs(value);
    const byYear = new Map<number, HistoryEvent>();
    for (const paragraph of paragraphs) {
        for (const sentence of paragraph.split(/(?<=[.!?])\s+(?=[A-Z])/)) {
            const matches = [...sentence.matchAll(/\b(?:1[6-9]\d{2}|20\d{2}|21\d{2})\b/g)];
            if (!matches.length) continue;
            const years = [...new Set(matches.map((match) => Number(match[0])))];
            if (years.length > 1 && !/\bmasa berlaku\b|\bberlaku (?:hingga|sampai)\b/i.test(sentence)) continue;
            const prefix = sentence.slice(0, matches[0].index);
            if (/\bberlaku\s+(?:(?:hingga|sampai)\s+)?(?:\d{1,2}\s+\p{L}+\s+)?$/iu.test(prefix)) continue;
            const event = { year: years[0], title: eventTitle(sentence), text: sentence.trim() };
            const previous = byYear.get(event.year);
            if (!previous || (previous.title === "Perkembangan institusi" && event.title !== previous.title)) {
                byYear.set(event.year, event);
            }
        }
    }
    const intro = paragraphs.find((part) =>
        !/^sejarah program studi\b/i.test(part) && !/\b\d{4}\b/.test(part) && /[.!?]$/.test(part),
    ) || paragraphs.find((part) => !/^sejarah program studi\b/i.test(part)) || paragraphs[0] || "";
    return { paragraphs, intro, events: [...byYear.values()].sort((a, b) => a.year - b.year) };
}

export function institutionalLabel(value: string | null | undefined, kind: "Visi" | "Misi") {
    return new RegExp("^\\s*" + kind + "\\s+ITB\\s*HAS\\s*:", "i").test(value || "");
}

export function purposeText(value: string | null | undefined, kind: "Visi" | "Misi") {
    return (value || "").replace(new RegExp("^\\s*" + kind + "\\s+ITB\\s*HAS\\s*:\\s*", "i"), "").trim();
}

export function profileMission(value?: string | null) {
    const text = purposeText(value, "Misi");
    const intro: string[] = [];
    const items: { marker: string; text: string }[] = [];
    for (const line of text.replace(/\r\n?/g, "\n").split("\n")) {
        const match = /^\s*([a-z]|\d{1,2})[.)]\s*(\S.*)$/i.exec(line);
        if (match) items.push({ marker: match[1].toLowerCase(), text: match[2] });
        else if (items.length) items[items.length - 1].text += "\n" + line;
        else intro.push(line);
    }
    const numeric = items[0]?.marker === "1";
    const valid = items.length > 0 && items.every((item, index) =>
        item.marker === (numeric ? String(index + 1) : String.fromCharCode(97 + index)),
    );
    return valid
        ? { intro: profileParagraphs(intro.join("\n")), items: items.map((item) => ({ ...item, text: item.text.trim() })), fallback: [] }
        : { intro: [], items: [], fallback: profileParagraphs(text) };
}

export function profileAccreditation(value?: string | null) {
    const text = (value || "").trim();
    const grades = ["Baik Sekali", "Unggul", "Baik", "A", "B", "C"];
    const readable = text.replace(/["'“”‘’]/g, "");
    const direct = grades.find((grade) => readable.trim().replace(/[.!]+$/, "").toLowerCase() === grade.toLowerCase());
    const named = /(?:terakreditasi|akreditasi|peringkat|status)\s*(?::|-)?\s*(Baik\s+Sekali|Unggul|Baik)\b/i.exec(readable)?.[1];
    const letter = /(?:terakreditasi|akreditasi|peringkat|status)\s*(?::|-)?\s*([ABC])\b(?![\w./])/i.exec(readable)?.[1];
    const candidate = (named || letter)?.replace(/\s+/g, " ").toLowerCase();
    const grade = direct || grades.find((item) => item.toLowerCase() === candidate) || null;
    const decree = /\b(?:SK|surat keputusan)(?:\s+(?:nomor|no\.?))?\s*:?\s*([A-Z0-9][A-Z0-9./_-]{3,})/i.exec(text)?.[1].replace(/[.,]+$/, "") || null;
    const year = decree?.match(/\b(?:19|20)\d{2}\b/g)?.at(-1) || null;
    const agency = /\bLAMEMBA\b/i.test(text) ? "LAMEMBA" : /\bBAN[ -]?PT\b/i.test(text) ? "BAN-PT" : null;
    const statusOnly = Boolean(grade && new RegExp(
        "^(?:(?:terakreditasi|akreditasi|peringkat|status)\\s*(?::|-)?\\s*)?" + grade + "\\s*[.!]?$", "i",
    ).test(readable.replace(/\s+/g, " ").trim()));
    return { text, grade, decree, year, agency, statusOnly };
}

export function profileDocumentUrl(value?: string | null): string | null {
    const text = (value || "").trim();
    if (!text || /[\x00-\x20\x7f\\]/.test(text)) return null;
    if (/^\/dokumen\/(?:[a-z0-9_-]+\.pdf|unggahan\/[a-f0-9]{32}\.pdf)$/i.test(text)) return text;
    try {
        const url = new URL(text);
        return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password ? url.href : null;
    } catch { return null; }
}
