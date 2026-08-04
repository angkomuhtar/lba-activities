import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/role-permissions";
import { prisma } from "@/lib/prisma";
import { PERMS } from "@/lib/perm-ids";
import type { Permission } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreatePermissionForm } from "./create-permission-form";
import { DeletePermissionButton } from "./delete-permission-button";

export const dynamic = "force-dynamic";

export default async function PermissionsPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login");
  if (!(await can(sessionUser.role, PERMS.settingsManage))) redirect("/");

  const permissions = await prisma.permission.findMany({ orderBy: { id: "asc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Permission</h1>
        <p className="text-sm text-muted-foreground">
          Kelola permission yang bisa diberikan kepada role.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <CreatePermissionForm />
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-xl border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions.map((p: Permission) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <code className="rounded bg-muted px-2 py-0.5 text-xs">
                        {p.id}
                      </code>
                    </TableCell>
                    <TableCell className="font-medium">{p.label}</TableCell>
                    <TableCell>{p.description ?? "-"}</TableCell>
                    <TableCell className="text-right">
                      <DeletePermissionButton permissionId={p.id} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}