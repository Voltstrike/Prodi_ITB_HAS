import { isAdminRole } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";


export async function requireAdmin() {
    const user = await getSession();

    if (!user) {
        redirect("/admin/login");
    }

    if (!isAdminRole(user.role)) {
        redirect("/admin/login");
    }

    return user;
}