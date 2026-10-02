import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ruteLabel } from "@/lib/jetties";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/role-permissions";
import { PERMS } from "@/lib/perm-ids";
import { LaporanAktivitasClient } from "./laporan-aktivitas-client";

export const dynamic = "force-dynamic";

export default async function LaporanAktivitasPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!(await can(user.role, PERMS.shipView))) redirect("/");

  const [ships, activities] = await Promise.all([
    prisma.ship.findMany({ orderBy: { nama: "asc" }, select: { id: true, nama: true } }),
    prisma.shipActivity.findMany({
      orderBy: [{ tanggal: "desc" }, { createdAt: "desc" }],
      include: {
        ship: { select: { nama: true } },
        voyage: {
          select: {
            siNomor: true,
            ruteAsalJetty: { select: { nama: true, location: true } },
            ruteTujuanJetty: { select: { nama: true, location: true } },
          },
        },
      },
    }),
  ]);

  const items = activities.map((a) => ({
    id: a.id,
    shipId: a.shipId,
    shipName: a.ship.nama,
    tanggal: a.tanggal.toISOString(),
    aktivitas: a.aktivitas,
    status: a.status,
    catatan: a.catatan,
    voyageLabel: a.voyage
      ? ruteLabel(a.voyage.ruteAsalJetty, a.voyage.ruteTujuanJetty, a.voyage.siNomor ? `SI ${a.voyage.siNomor}` : null)
      : null,
  }));

  return <LaporanAktivitasClient ships={ships} activities={items} />;
}
