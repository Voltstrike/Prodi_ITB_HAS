import { readAcademic, writeAcademic } from "@/lib/akademik/http";

export function GET() {
    return readAcademic("KalenderAkademik", true);
}

export function POST(request: Request) {
    return writeAcademic("KalenderAkademik", request);
}
