import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Ulangi seluruh rantai saldo fuel kapal agar konsisten terhadap pemakaian
// (StockRecord) dan pengisian (FuelRefill). Dipakai setelah create/delete
// pemakaian atau pengisian. Berjalan kronologis:
//   stokAwal(record non-pertama) = sisaStok record sebelumnya
//   sisaStok = stokAwal + Σ pengisian(sejak record sebelumnya) − ME − AE
export async function recomputeShipStock(shipId: string): Promise<void> {
  const [stocks, refills] = await Promise.all([
    prisma.stockRecord.findMany({
      where: { shipId },
      orderBy: [{ tanggal: "asc" }, { createdAt: "asc" }],
    }),
    prisma.fuelRefill.findMany({
      where: { shipId },
      orderBy: [{ tanggal: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  let running = new Prisma.Decimal(0);
  let refillIdx = 0;

  for (let i = 0; i < stocks.length; i++) {
    const rec = stocks[i];
    const recDay = startOfDay(rec.tanggal);
    const prevRec = stocks[i - 1];

    // Kumpulkan pengisian sejak record sebelumnya sampai hari record ini.
    let refillSum = new Prisma.Decimal(0);
    while (
      refillIdx < refills.length &&
      startOfDay(refills[refillIdx].tanggal).getTime() <= recDay.getTime()
    ) {
      refillSum = refillSum.add(refills[refillIdx].jumlah);
      refillIdx++;
    }

    // Record pertama: pertahankan stokAwal manual; pengisian sebelum record
    // pertama tidak dihitung (baseline manual sudah mencakup saldo saat itu).
    const stokAwal = prevRec ? running : rec.stokAwal;
    const sisaStok = stokAwal
      .add(prevRec ? refillSum : new Prisma.Decimal(0))
      .sub(new Prisma.Decimal(rec.me))
      .sub(new Prisma.Decimal(rec.ae));

    running = sisaStok;

    if (!stokAwal.equals(new Prisma.Decimal(rec.stokAwal)) || !sisaStok.equals(new Prisma.Decimal(rec.sisaStok))) {
      await prisma.stockRecord.update({
        where: { id: rec.id },
        data: { stokAwal, sisaStok },
      });
    }
  }
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}