import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { DEFAULT_ROLE_PERMISSIONS, type Permission, type Role } from "@/lib/permissions";

// Ambil set permission untuk sebuah role (nama role), efisien per request.
export const getPermissionsForRole = cache(async (role: Role) => {
  const rows = await prisma.rolePermission.findMany({
    where: { role: { name: role } },
    select: { permissionId: true },
  });

  if (rows.length === 0 && role in DEFAULT_ROLE_PERMISSIONS) {
    return new Set<Permission>(DEFAULT_ROLE_PERMISSIONS[role as string]);
  }

  return new Set<Permission>(rows.map((r) => r.permissionId));
});

export async function can(role: Role | undefined, permission: Permission) {
  if (!role) return false;
  const perms = await getPermissionsForRole(role);
  return perms.has(permission);
}