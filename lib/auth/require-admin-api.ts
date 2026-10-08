import { isAdminRole } from "@/lib/auth/roles";
import { getSession } from "@/lib/auth/session";

export async function requireAdminApi() {
    const user = await getSession();

    if (!user) {
        return null;
    }

    if (!isAdminRole(user.role)) {
        return null;
    }

    return user;
}