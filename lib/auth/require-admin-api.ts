import { getSession } from "@/lib/auth/session";

export async function requireAdminApi() {
    const user = await getSession();

    console.log("API AUTH USER:", user);

    if (!user) {
        return null;
    }

    if (user.role !== "ADMIN") {
        return null;
    }

    return user;
}