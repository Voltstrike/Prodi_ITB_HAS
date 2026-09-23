import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";


export async function requireAdmin() {
    const user = await getSession();

    if (!user) {
        redirect("/admin/login");
    }

    if (user.role !== "ADMIN") {
        redirect("/admin/login");
    }

    return user;
}