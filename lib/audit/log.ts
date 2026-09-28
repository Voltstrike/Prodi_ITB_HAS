import { db } from "@/prisma/db";

type AuditDb = Pick<typeof db, "orm">;

type CreateAuditLogInput = {
    userId: number;
    action: string;
    entity: string;
    entityId: number;
    details: string;
    dbClient?: AuditDb;
};

export async function createAuditLog({
    userId,
    action,
    entity,
    entityId,
    details,
    dbClient = db,
}: CreateAuditLogInput) {
    return dbClient.orm.public.AuditLog.create({
        userId,
        action,
        entity,
        entityId,
        details,
    });
}
