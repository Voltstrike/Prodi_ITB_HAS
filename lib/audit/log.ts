import { db } from "@/prisma/db";

type CreateAuditLogInput = {
    userId: number;
    action: string;
    entity: string;
    entityId: number;
    details: string;
};

export async function createAuditLog({
    userId,
    action,
    entity,
    entityId,
    details,
}: CreateAuditLogInput) {
    return db.orm.public.AuditLog.create({
        userId,
        action,
        entity,
        entityId,
        details,
    });
}
