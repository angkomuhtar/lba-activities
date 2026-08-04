import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/role-permissions";
import { prisma } from "@/lib/prisma";
import { PERMS } from "@/lib/perm-ids";
import { RolePermissionEditor } from "../../role-permission-editor";

export const dynamic = "force-dynamic";

interface RolePermissionsPageProps {
  params: Promise<{ id: string }>;
}

export default async function RolePermissionsPage({
  params,
}: RolePermissionsPageProps) {
  const { id } = await params;
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login");
  if (!(await can(sessionUser.role, PERMS.settingsManage))) redirect("/");

  const [role, permissions] = await Promise.all([
    prisma.role.findUnique({ where: { id } }),
    prisma.permission.findMany({ orderBy: { id: "asc" } }),
  ]);

  if (!role) notFound();

  const mappings = await prisma.rolePermission.findMany({
    where: { roleId: role.id },
  });
  const selected = new Set(mappings.map((m) => m.permissionId));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/roles"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Kembali ke Roles
        </Link>
        <h1 className="mt-2 text-lg font-semibold">
          Atur Permission — {role.label}
        </h1>
        <p className="text-sm text-muted-foreground">
          Centang permission yang dimiliki role ini.
        </p>
      </div>

      <RolePermissionEditor
        roleId={role.id}
        roleLabel={role.label}
        roleDescription={role.description}
        permissions={permissions.map((p) => ({ id: p.id, label: p.label }))}
        selected={selected}
      />
    </div>
  );
}