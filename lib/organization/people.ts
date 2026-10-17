import "server-only";
import { db } from "@/prisma/db";
import {
    organizationPersonKey,
    type OrganizationPerson,
    type OrganizationStructure,
} from "@/lib/organization/structure";

type OrganizationModels = Pick<typeof db.orm.public, "Dosen" | "Staff">;

export async function getOrganizationPeople(
    structure: OrganizationStructure,
    models: OrganizationModels = db.orm.public,
): Promise<OrganizationPerson[]> {
    const dosenIds = [...new Set(structure.nodes.flatMap((node) =>
        node.person?.type === "dosen" ? [node.person.id] : [],
    ))];
    const staffIds = [...new Set(structure.nodes.flatMap((node) =>
        node.person?.type === "staff" ? [node.person.id] : [],
    ))];

    const [dosen, staff] = await Promise.all([
        dosenIds.length > 0
            ? models.Dosen.where((row) => row.id.in(dosenIds))
                .select("id", "nama").all()
            : Promise.resolve([]),
        staffIds.length > 0
            ? models.Staff.where((row) => row.id.in(staffIds))
                .select("id", "nama").all()
            : Promise.resolve([]),
    ]);

    return [
        ...dosen.map((row): OrganizationPerson => ({
            type: "dosen", id: row.id, nama: row.nama,
        })),
        ...staff.map((row): OrganizationPerson => ({
            type: "staff", id: row.id, nama: row.nama,
        })),
    ];
}

export function missingOrganizationPerson(
    structure: OrganizationStructure,
    people: readonly OrganizationPerson[],
): string | null {
    const available = new Set(people.map(organizationPersonKey));
    const missing = structure.nodes.find((node) =>
        node.person !== null &&
        !available.has(organizationPersonKey(node.person)),
    );

    return missing
        ? `Orang yang dipilih untuk jabatan "${missing.jabatan}" tidak tersedia. Pilih pengganti atau kosongkan pilihan.`
        : null;
}

export async function listOrganizationPeople(): Promise<OrganizationPerson[]> {
    const [dosen, staff] = await Promise.all([
        db.orm.public.Dosen.select("id", "nama")
            .orderBy([(row) => row.nama.asc(), (row) => row.id.asc()]).all(),
        db.orm.public.Staff.select("id", "nama")
            .orderBy([(row) => row.nama.asc(), (row) => row.id.asc()]).all(),
    ]);

    return [
        ...dosen.map((row): OrganizationPerson => ({
            type: "dosen", id: row.id, nama: row.nama,
        })),
        ...staff.map((row): OrganizationPerson => ({
            type: "staff", id: row.id, nama: row.nama,
        })),
    ];
}
