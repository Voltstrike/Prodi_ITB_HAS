import { readAcademic, writeAcademic, type IdContext } from "@/lib/akademik/http";

export function GET(_request: Request, ctx: IdContext) {
    return readAcademic("KalenderAkademik", true, ctx);
}

export function PUT(request: Request, ctx: IdContext) {
    return writeAcademic("KalenderAkademik", request, ctx);
}

export { DELETE } from "@/app/api/kalender-akademik/[id]/route";
