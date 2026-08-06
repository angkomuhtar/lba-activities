import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/role-permissions";
import { PERMS } from "@/lib/perm-ids";
import { ActivitiesClient } from "./activities-client";

export const dynamic = "force-dynamic";

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ ship?: string }>;
}) {
  const { ship } = await searchParams;
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!(await can(user.role, PERMS.shipView))) redirect("/");

  const canManage = await can(user.role, PERMS.activityManage);

  const [ships, categories, activities, voyageGroup] = await Promise.all([
    prisma.ship.findMany({ orderBy: { nama: "asc" }, select: { id: true, nama: true } }),
    prisma.activityCategory.findMany({ orderBy: { nama: "asc" } }),
    prisma.shipActivity.findMany({
      where: ship ? { shipId: ship } : {},
      orderBy: [{ tanggal: "desc" }, { createdAt: "desc" }],
      include: {
        ship: { select: { nama: true } },
        voyage: { select: { ruteAsal: true, ruteTujuan: true, siNomor: true } },
      },
    }),
    prisma.voyage.groupBy({ by: ["shipId"], _count: { _all: true } }),
  ]);

  const selectedShipId = ship && ships.some((s) => s.id === ship) ? ship : "";

  const voyageCounts: Record<string, number> = {};
  for (const g of voyageGroup) {
    voyageCounts[g.shipId] = g._count._all;
  }

  const enriched = activities.map((a) => ({
    ...a,
    voyageLabel: a.voyage
      ? a.voyage.ruteAsal || a.voyage.ruteTujuan
        ? `${a.voyage.ruteAsal || "?"} → ${a.voyage.ruteTujuan || "?"}`
        : a.voyage.siNomor
          ? `SI ${a.voyage.siNomor}`
          : "Pelayaran"
      : null,
  }));

  return (
    <ActivitiesClient
      ships={ships}
      categories={categories.map((c) => c.nama)}
      activities={enriched}
      voyageCounts={voyageCounts}
      canManage={canManage}
      selectedShipId={selectedShipId}
    />
  );
}