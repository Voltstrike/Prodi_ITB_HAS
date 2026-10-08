import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { isSuperAdminRole } from "@/lib/auth/roles";

export async function requireSuperAdminApi() {
    const user = await requireAdminApi();

    if (!user || !isSuperAdminRole(user.role)) {
        return null;
    }

    return user;
}
