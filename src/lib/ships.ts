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
  const activitiesByShip = new Map<string, (typeof activities)[number][]>();
  for (const act of activities) {
    if (!latestActByShip.has(act.shipId)) latestActByShip.set(act.shipId, act);
    const arr = activitiesByShip.get(act.shipId) ?? [];
    arr.push(act);
    activitiesByShip.set(act.shipId, arr);
  }

  const stocksByShip = new Map<string, (typeof stocks)[number][]>();
  for (const rec of stocks) {
    const arr = stocksByShip.get(rec.shipId) ?? [];
    arr.push(rec);
    stocksByShip.set(rec.shipId, arr);
  }

  // Voyage terbaru/berjalan per kapal: prioritas yang masih aktif (tglEnd kosong),
  // lalu yang tglStart-nya paling baru.
  const voyagesByShip = new Map<string, (typeof voyages)[number][]>();
  for (const v of voyages) {
    const arr = voyagesByShip.get(v.shipId) ?? [];
    arr.push(v);
    voyagesByShip.set(v.shipId, arr);
  }

  const currentVoyageByShip = new Map<string, (typeof voyages)[number]>();
  for (const [shipId, list] of voyagesByShip) {
    const active = list
      .filter((v) => v.tglEnd === null)
      .sort((a, b) => (b.tglStart?.getTime() ?? 0) - (a.tglStart?.getTime() ?? 0));
    const latest = [...list].sort((a, b) => (b.tglStart?.getTime() ?? 0) - (a.tglStart?.getTime() ?? 0));
    currentVoyageByShip.set(shipId, active[0] ?? latest[0]);
  }

  return ships.map((ship) => {
    const shipStocks = stocksByShip.get(ship.id) ?? [];
    const voyage = currentVoyageByShip.get(ship.id) ?? null;
    // Hanya aktivitas milik voyage terakhir/berjalan yang tampil di modal kartu.
    const voyageActivities = (activitiesByShip.get(ship.id) ?? []).filter(
      (a) => a.voyageId === voyage?.id,
    );
    const actDate = (name: string): string | null => {
      const found = voyageActivities
        .filter((a) => a.aktivitas === name)
        .sort((a, b) => a.tanggal.getTime() - b.tanggal.getTime());
      return found[0] ? found[0].tanggal.toISOString() : null;
    };
    return {
      ship: { id: ship.id, nama: ship.nama, muatan: ship.muatan },
      latest: latestActByShip.get(ship.id) ?? null,
      fuelSisa: shipStocks[0]?.sisaStok.toString() ?? null,
      siAda: Boolean(voyage?.siNomor && voyage.siTanggal),
      spalAda: Boolean(voyage?.spalNomor && voyage.spalTanggal),
      ruteAsal: voyage?.ruteAsal ?? null,
      ruteTujuan: voyage?.ruteTujuan ?? null,
      shipper: voyage?.shipper ?? null,
      statusBayar: voyage?.statusBayar ?? null,
      loadingStart: actDate("Start Loading"),
      loadingFinish: actDate("Finish Loading"),
      bongkarStart: actDate("Start Bongkar"),
      bongkarFinish: actDate("Finish Bongkar"),
      activities: voyageActivities.map((a) => ({
        id: a.id,
        status: a.status,
        aktivitas: a.aktivitas,
        tanggal: a.tanggal.toISOString(),
        catatan: a.catatan,
      })),
      stocks: shipStocks.map((r) => ({
        id: r.id,
        tanggal: r.tanggal.toISOString(),
        stokAwal: r.stokAwal.toString(),
        pengisian: r.pengisian.toString(),
        me: r.me.toString(),
        ae: r.ae.toString(),
        sisaStok: r.sisaStok.toString(),
        catatan: r.catatan,
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
