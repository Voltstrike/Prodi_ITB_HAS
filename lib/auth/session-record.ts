import { db } from "@/prisma/db";
import { isAdminRole } from "@/lib/auth/roles";

type CreateSessionRecordInput = {
    userId: number;
    verifiedPasswordHash: string;
    tokenHash: string;
    expiresAt: string;
};

export async function createSessionRecord({
    userId,
    verifiedPasswordHash,
    tokenHash,
    expiresAt,
}: CreateSessionRecordInput): Promise<boolean> {
    return db.transaction(async (tx) => {
        const lock = db.raw.sql`
            SELECT id FROM public."adminUser"
            WHERE id = ${userId}
            FOR UPDATE
        `.returnsRow({ id: "pg/int4@1" }).build();

        await tx.query(lock);

        const user = await tx.orm.public.AdminUser
            .where({ id: userId })
            .select("passwordHash", "role", "isActive")
            .first();

        if (
            !user ||
            !user.isActive ||
            !isAdminRole(user.role) ||
            user.passwordHash !== verifiedPasswordHash
        ) {
            return false;
        }

        await tx.orm.public.AdminSession.create({
            userId,
            tokenHash,
            expiresAt,
        });

        return true;
    });
}
