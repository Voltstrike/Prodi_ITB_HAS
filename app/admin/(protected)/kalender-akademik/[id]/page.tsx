import AcademicEditor from "@/components/admin/AcademicEditor";
import { notFound, redirect } from "next/navigation";
import { db } from "@/prisma/db";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { toKalenderAkademikDto } from "@/lib/http/dto";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    if (!(await requireAdminApi())) redirect("/admin/login");
    const { id } = await params;
    if (!/^[1-9]\d*$/.test(id) || Number(id) > 2147483647) notFound();
    const row = await db.orm.public.KalenderAkademik.where({ id: Number(id) }).first();
    if (!row) notFound();
    return <AcademicEditor key={row.id} kind="kalender" entry={toKalenderAkademikDto(row)} />;
}
