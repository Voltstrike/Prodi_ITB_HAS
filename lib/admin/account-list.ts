import { db } from "@/prisma/db";
import { toAccountDto } from "@/lib/admin/accounts";

export async function getAccountsPage(rawPage: string = "1") {
    const number = /^\d+$/.test(rawPage) ? Number(rawPage) : 1;
    const requestedPage =
        Number.isSafeInteger(number) && number > 0 ? number : 1;
    const pageSize = 25;
    const { total } = await db.orm.public.AdminUser.aggregate((a) => ({
        total: a.count(),
    }));
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(requestedPage, totalPages);
    const accounts = await db.orm.public.AdminUser
        .select("id", "nama", "email", "role", "isActive", "createdAt", "updatedAt")
        .orderBy([(a) => a.createdAt.desc(), (a) => a.id.desc()])
        .offset((page - 1) * pageSize)
        .limit(pageSize)
        .all();

    return { accounts: accounts.map(toAccountDto), total, page, totalPages };
}
