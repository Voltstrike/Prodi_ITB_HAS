import { readAcademic, writeAcademic } from "@/lib/akademik/http";

export function GET() {
    return readAcademic("InformasiAkademik", true);
}

export function POST(request: Request) {
    return writeAcademic("InformasiAkademik", request);
}
