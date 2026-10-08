import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { isSuperAdminRole } from "@/lib/auth/roles";

export async function requireSuperAdmin() {
    const user = await requireAdmin();

    if (!isSuperAdminRole(user.role)) {
        redirect("/admin");
    }

    return user;
}
