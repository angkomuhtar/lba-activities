import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/role-permissions";
import { PERMS } from "@/lib/perm-ids";
import type { JettyType } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreateJettyForm } from "./create-jetty-form";
import { DeleteJettyButton } from "./delete-jetty-button";
import { EditJettyModal } from "./edit-jetty-modal";

export const dynamic = "force-dynamic";

export default async function JettiesPage() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login");
  if (!(await can(sessionUser.role, PERMS.shipView))) redirect("/");

  const jetties = await prisma.jetty.findMany({ orderBy: { nama: "asc" } });
  const canManage = await can(sessionUser.role, PERMS.shipManage);

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-lg font-semibold'>Daftar Jetty</h1>
          <p className='text-sm text-muted-foreground'>
            Kelola master data lokasi loading & discharging.
          </p>
        </div>
        {canManage && <CreateJettyForm />}
      </div>

      <div className='rounded-xl border bg-background'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Jetty</TableHead>
              <TableHead>Alias</TableHead>
              <TableHead>Lokasi</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Koordinat</TableHead>
              {canManage && <TableHead className='text-right'>Aksi</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {jetties.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={canManage ? 6 : 5}
                  className='py-8 text-center text-sm text-muted-foreground'>
                  Belum ada jetty. Tambahkan jetty pertama.
                </TableCell>
              </TableRow>
            ) : (
              jetties.map((jetty) => (
                <TableRow key={jetty.id}>
                  <TableCell className='font-medium'>{jetty.nama}</TableCell>
                  <TableCell className='text-sm text-muted-foreground'>
                    {jetty.alias || "-"}
                  </TableCell>
                  <TableCell className='text-sm text-muted-foreground'>
                    {jetty.location || "-"}
                  </TableCell>
                  <TableCell>
                    {jetty.type ? (
                      <TypeBadge type={jetty.type} />
                    ) : (
                      <span className='text-muted-foreground'>-</span>
                    )}
                  </TableCell>
                  <TableCell className='font-mono text-sm text-muted-foreground'>
                    {jetty.lat !== null && jetty.lon !== null
                      ? `${jetty.lat.toFixed(4)}, ${jetty.lon.toFixed(4)}`
                      : "-"}
                  </TableCell>
                  {canManage && (
                    <TableCell className='text-right'>
                      <span className='inline-flex gap-1'>
                        <EditJettyModal jetty={jetty} />
                        <DeleteJettyButton id={jetty.id} nama={jetty.nama} />
                      </span>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function TypeBadge({ type }: { type: JettyType }) {
  const isLoading = type === "LOADING";
  return (
    <span
      className={
        isLoading
          ? "inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-600"
          : "inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-xs font-medium text-amber-600"
      }>
      {isLoading ? "Loading" : "Discharging"}
    </span>
  );
}