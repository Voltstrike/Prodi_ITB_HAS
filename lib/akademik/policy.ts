export const ACADEMIC_STATUSES = ["DRAFT", "PUBLISHED"] as const;
export type AcademicStatus = (typeof ACADEMIC_STATUSES)[number];
export const ACADEMIC_SEMESTERS = ["GANJIL", "GENAP"] as const;

export function isAcademicStatus(value: unknown): value is AcademicStatus {
    return value === "DRAFT" || value === "PUBLISHED";
}

export function isAcademicDate(value: unknown): value is string {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const year = Number(value.slice(0, 4));
    if (year < 1900 || year > 2199) return false;
    const parsed = new Date(value + "T00:00:00Z");
    return Number.isFinite(parsed.getTime())
        && parsed.toISOString().slice(0, 10) === value;
}

export function isAcademicYear(value: unknown): value is string {
    if (typeof value !== "string" || !/^\d{4}\/\d{4}$/.test(value)) return false;
    const [start, end] = value.split("/").map(Number);
    return start >= 1900 && end <= 2199 && end === start + 1;
}

export function academicToday(now = new Date()): string {
    const parts = new Intl.DateTimeFormat("en", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(now);

    const part = (type: Intl.DateTimeFormatPartTypes) =>
        parts.find((item) => item.type === type)?.value;

    return [part("year"), part("month"), part("day")].join("-");
}

export type CalendarActivity =
    "UPCOMING" | "ONGOING" | "FINISHED" | "UNKNOWN";

export function calendarActivity(
    start: string,
    end: string | null | undefined,
    today = academicToday(),
): CalendarActivity {
    const last = end || start;

    if (
        !isAcademicDate(start)
        || !isAcademicDate(last)
        || !isAcademicDate(today)
        || last < start
    ) return "UNKNOWN";

    if (today < start) return "UPCOMING";
    return today > last ? "FINISHED" : "ONGOING";
}

export function academicDateLabel(value: string): string {
    if (!isAcademicDate(value)) {
        return value || "Tanggal belum ditentukan";
    }

    return new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(new Date(value + "T00:00:00+07:00"));
}

export function firstPublishedAt(
    previous: {
        status: string;
        diterbitkanPada: string | null;
        createdAt: string;
    } | null,
    nextStatus: AcademicStatus,
    now = new Date(),
): string | null {
    if (previous?.diterbitkanPada) return previous.diterbitkanPada;
    if (previous?.status === "PUBLISHED") return previous.createdAt;
    return nextStatus === "PUBLISHED" ? now.toISOString() : null;
}

export function academicSummary(value: string, limit = 220): string {
    const first = value.trim()
        .replace(/\r\n?/g, "\n")
        .split(/\n[\t ]*\n/)[0] || "";

    const text = first.replace(/\s+/g, " ").trim();
    const characters = Array.from(text);

    return characters.length > limit
        ? characters.slice(0, Math.max(0, limit - 1))
            .join("").trimEnd() + "…"
        : text;
}
