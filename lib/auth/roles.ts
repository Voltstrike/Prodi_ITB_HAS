export type AdminRole = "ADMIN" | "SUPER_ADMIN";

export function isAdminRole(role: string): role is AdminRole {
    return role === "ADMIN" || role === "SUPER_ADMIN";
}

export function isSuperAdminRole(role: string): boolean {
    return role === "SUPER_ADMIN";
}
