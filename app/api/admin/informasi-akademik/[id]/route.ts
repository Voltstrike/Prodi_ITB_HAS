import { readAcademic, writeAcademic, type IdContext } from "@/lib/akademik/http";

export function GET(_request: Request, ctx: IdContext) {
    return readAcademic("InformasiAkademik", true, ctx);
}

export function PUT(request: Request, ctx: IdContext) {
    return writeAcademic("InformasiAkademik", request, ctx);
}

export { DELETE } from "@/app/api/informasi-akademik/[id]/route";
