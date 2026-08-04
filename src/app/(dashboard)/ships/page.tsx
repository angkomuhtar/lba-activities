import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/role-permissions";
import { PERMS } from "@/lib/perm-ids";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreateShipForm } from "./create-ship-form";
import { DeleteShipButton } from "./delete-ship-button";
import { statusColor, statusText } from "@/lib/ships";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ShipsPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login");
  if (!(await can(sessionUser.role, PERMS.shipView))) redirect("/");

  const ships = await prisma.ship.findMany({
    orderBy: { createdAt: "asc" },
    include: { activities: { orderBy: [{ tanggal: "desc" }, { createdAt: "desc" }], take: 1 } },
  });

  const canManage = await can(sessionUser.role, PERMS.shipManage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold">Daftar Kapal</h1>
          <p className="text-sm text-muted-foreground">
            Kelola master data kapal dan lihat status terkini.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {canManage && (
          <div className="lg:col-span-1">
            <CreateShipForm />
          </div>
        )}

        <div className={canManage ? "lg:col-span-2" : "lg:col-span-3"}>
          <div className="rounded-xl border bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Kapal</TableHead>
                  <TableHead>Muatan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aktivitas Terakhir</TableHead>
                  {canManage && <TableHead className="text-right">Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {ships.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canManage ? 5 : 4} className="py-8 text-center text-sm text-muted-foreground">
                      Belum ada kapal. Tambahkan kapal pertama.
                    </TableCell>
                  </TableRow>
                ) : (
                  ships.map((ship) => {
                    const latest = ship.activities[0] ?? null;
                    return (
                      <TableRow key={ship.id}>
                        <TableCell>
                          <Link href={`/ships/${ship.id}`} className="font-medium hover:underline">
                            {ship.nama}
                          </Link>
                        </TableCell>
                        <TableCell>{ship.muatan || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1.5">
                            <span className={cn("size-2 rounded-full", statusColor(latest?.status ?? null))} />
                            {statusText(latest?.status ?? null)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {latest ? `${latest.aktivitas} — ${formatDate(latest.tanggal)}` : "-"}
                        </TableCell>
                        {canManage && (
                          <TableCell className="text-right">
                            <DeleteShipButton id={ship.id} name={ship.nama} />
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}