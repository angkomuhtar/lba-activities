import "server-only";

import { prisma } from "@/lib/prisma";
import { statusColor, statusText, type ShipWithStatus } from "@/lib/ship-status";

export { statusColor, statusText };
export type { ShipWithStatus };

// Semua kapal + status terbaru (aktivitas terakhir), sisa fuel, dan status dokumen.
export async function getShipsWithStatus(): Promise<ShipWithStatus[]> {
  const ships = await prisma.ship.findMany({ orderBy: { createdAt: "asc" } });

  const ids = ships.map((s) => s.id);

  const [activities, stocks, voyages] = await Promise.all([
    prisma.shipActivity.findMany({
      where: { shipId: { in: ids } },
      orderBy: [{ tanggal: "desc" }, { createdAt: "desc" }],
    }),
    prisma.stockRecord.findMany({
      where: { shipId: { in: ids } },
      orderBy: [{ tanggal: "desc" }, { createdAt: "desc" }],
    }),
    prisma.voyage.findMany({ where: { shipId: { in: ids } } }),
  ]);

  const latestActByShip = new Map<string, (typeof activities)[number]>();
  for (const act of activities) {
    if (!latestActByShip.has(act.shipId)) latestActByShip.set(act.shipId, act);
  }

  const stocksByShip = new Map<string, (typeof stocks)[number][]>();
  for (const rec of stocks) {
    const arr = stocksByShip.get(rec.shipId) ?? [];
    arr.push(rec);
    stocksByShip.set(rec.shipId, arr);
  }

  const voyageByShip = new Map(voyages.map((v) => [v.shipId, v]));

  return ships.map((ship) => {
    const shipStocks = stocksByShip.get(ship.id) ?? [];
    const voyage = voyageByShip.get(ship.id);
    return {
      ship: { id: ship.id, nama: ship.nama, muatan: ship.muatan },
      latest: latestActByShip.get(ship.id) ?? null,
      fuelSisa: shipStocks[0]?.sisaStok.toString() ?? null,
      siAda: Boolean(voyage?.siNomor && voyage.siTanggal),
      spalAda: Boolean(voyage?.spalNomor && voyage.spalTanggal),
      stocks: shipStocks.map((r) => ({
        id: r.id,
        tanggal: r.tanggal.toISOString(),
        stokAwal: r.stokAwal.toString(),
        me: r.me.toString(),
        ae: r.ae.toString(),
        sisaStok: r.sisaStok.toString(),
      })),
    };
  });
}

export async function getShipDetail(id: string) {
  const ship = await prisma.ship.findUnique({
    where: { id },
    include: {
      voyages: {
        orderBy: [{ tglStart: "desc" }, { createdAt: "desc" }],
        include: {
          activities: { orderBy: [{ tanggal: "desc" }, { createdAt: "desc" }] },
        },
      },
      activities: { orderBy: [{ tanggal: "desc" }, { createdAt: "desc" }] },
      stocks: { orderBy: [{ tanggal: "desc" }, { createdAt: "desc" }] },
    },
  });
  return ship;
}

export async function getActivityCategories() {
  return prisma.activityCategory.findMany({ orderBy: { nama: "asc" } });
}
