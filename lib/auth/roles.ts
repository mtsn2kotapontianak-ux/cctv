export const userRoles = ["admin", "principal", "parent"] as const;

export type UserRole = (typeof userRoles)[number];

export const roleHomePath: Record<UserRole, string> = {
  admin: "/admin",
  principal: "/principal",
  parent: "/parent"
};

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && userRoles.includes(value as UserRole);
}
