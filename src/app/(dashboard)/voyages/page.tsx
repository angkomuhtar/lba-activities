import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/role-permissions";
import { PERMS } from "@/lib/perm-ids";
import { VoyagesClient } from "./voyages-client";

export const dynamic = "force-dynamic";

export default async function VoyagesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!(await can(user.role, PERMS.shipView))) redirect("/");

  const canManage = await can(user.role, PERMS.shipManage);

  const [ships, voyages] = await Promise.all([
    prisma.ship.findMany({ orderBy: { nama: "asc" }, select: { id: true, nama: true } }),
    prisma.voyage.findMany({
      orderBy: [{ tglStart: "desc" }, { createdAt: "desc" }],
      include: {
        ship: { select: { nama: true } },
        activities: { orderBy: [{ tanggal: "desc" }, { createdAt: "desc" }] },
      },
    }),
  ]);

  const items = voyages.map((v) => ({
    id: v.id,
    shipId: v.shipId,
    shipName: v.ship.nama,
    ruteAsal: v.ruteAsal,
    ruteTujuan: v.ruteTujuan,
    shipper: v.shipper,
    tglStart: v.tglStart ? toInputDate(v.tglStart) : null,
    tglEnd: v.tglEnd ? toInputDate(v.tglEnd) : null,
    siNomor: v.siNomor,
    siTanggal: v.siTanggal ? toInputDate(v.siTanggal) : null,
    spalNomor: v.spalNomor,
    spalTanggal: v.spalTanggal ? toInputDate(v.spalTanggal) : null,
    catatan: v.catatan,
    activities: v.activities.map((a) => ({
      id: a.id,
      aktivitas: a.aktivitas,
      status: a.status,
      tanggal: toInputDate(a.tanggal),
      catatan: a.catatan,
    })),
  }));

  return <VoyagesClient ships={ships} voyages={items} canManage={canManage} />;
}

function toInputDate(value: Date): string {
  const d = new Date(value);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
