import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/role-permissions";
import { PERMS } from "@/lib/perm-ids";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserActions } from "./user-actions";
import { CreateUserForm } from "./create-user-form";
import { roleLabel } from "@/lib/role-label";
import { Pagination } from "@/components/ui/pagination";

export const dynamic = "force-dynamic";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page = "1" } = await searchParams;
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/login");
  }

  if (!(await can(sessionUser.role, PERMS.userManage))) {
    redirect("/");
  }

  const [users, roles] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.role.findMany({ orderBy: { name: "asc" } }),
  ]);

  // Sembunyikan user dengan role superadmin jika session user bukan superadmin
  const visibleUsers =
    sessionUser.role === "superadmin" ? users : users.filter((u) => u.role !== "superadmin");

  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(visibleUsers.length / PAGE_SIZE));
  const parsed = Number(page);
  const pageNum = Number.isFinite(parsed) && parsed > 0 ? Math.min(Math.floor(parsed), totalPages) : 1;
  const rows = visibleUsers.slice((pageNum - 1) * PAGE_SIZE, pageNum * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold">Kelola User</h1>
          <p className="text-sm text-muted-foreground">
            Tambah, ubah role, dan hapus akun pengguna aplikasi.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <CreateUserForm roles={roles.map((r) => ({ name: r.name, label: r.label }))} />
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-xl border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.name ?? "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{roleLabel(user.role, roles)}</Badge>
                    </TableCell>
                    <TableCell>
                      {user.isActive ? (
                        <span className="text-sm text-emerald-600">Aktif</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Nonaktif</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <UserActions
                        user={{
                          id: user.id,
                          username: user.username,
                          role: user.role,
                          isSelf: user.id === sessionUser.id,
                        }}
                        roles={roles.map((r) => ({ name: r.name, label: r.label }))}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {visibleUsers.length > 0 && <Pagination page={pageNum} totalPages={totalPages} />}
          </div>
        </div>
      </div>
    </div>
  );
}