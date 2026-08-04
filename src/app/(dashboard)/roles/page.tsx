import Link from "next/link";
import { redirect } from "next/navigation";
import { Settings2 } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/role-permissions";
import { prisma } from "@/lib/prisma";
import { PERMS } from "@/lib/perm-ids";
import type { Role } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreateRoleForm } from "./create-role-form";
import { DeleteRoleButton } from "./delete-role-button";

export const dynamic = "force-dynamic";

export default async function RolesPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login");
  if (!(await can(sessionUser.role, PERMS.settingsManage))) redirect("/");

  const roles = await prisma.role.findMany({ orderBy: { system: "desc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Roles</h1>
        <p className="text-sm text-muted-foreground">
          Kelola role yang tersedia untuk pengguna aplikasi.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <CreateRoleForm />
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-xl border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role: Role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <div className="font-medium">{role.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {role.name}
                      </div>
                    </TableCell>
                    <TableCell>{role.description ?? "-"}</TableCell>
                    <TableCell>
                      {role.system ? (
                        <Badge variant="secondary">Sistem</Badge>
                      ) : (
                        <Badge variant="outline">Custom</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/roles/${role.id}/permissions`}
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-input px-2.5 text-sm"
                        >
                          <Settings2 className="size-3.5" />
                          Atur Permission
                        </Link>
                        {!role.system && <DeleteRoleButton roleId={role.id} />}
                      </div>
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