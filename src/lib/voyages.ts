import "server-only";

import { prisma } from "@/lib/prisma";
import type { ActivityStatus } from "@prisma/client";

// Taut aktivitas ke voyage dengan aturan:
// - voyage cocok jika tglStart <= D <= tglEnd, atau tglEnd kosong (masih berjalan).
// - jika beberapa cocok, pilih tglStart terbaru (voyage yang baru mulai dijadikan pemenang).
// - jika tak ada yang cocok, hasil null (tanpa voyage).
export async function assignVoyageToActivity(
  shipId: string,
  tanggal: Date,
): Promise<string | null> {
  const candidates = await prisma.voyage.findMany({
    where: {
      shipId,
      AND: [
        { OR: [{ tglStart: null }, { tglStart: { lte: tanggal } }] },
        { OR: [{ tglEnd: null }, { tglEnd: { gte: tanggal } }] },
      ],
    },
  });

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    const sa = a.tglStart ?? new Date(0);
    const sb = b.tglStart ?? new Date(0);
    if (sa.getTime() !== sb.getTime()) return sb.getTime() - sa.getTime();
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return candidates[0].id;
}

export interface VoyageMonthly {
  month: string; // "2026-08"
  label: string; // "Agu 2026"
  count: number;
}

export async function getVoyagesMonthly(shipId?: string): Promise<VoyageMonthly[]> {
  const voyages = await prisma.voyage.findMany({
    where: shipId ? { shipId } : undefined,
    select: { tglStart: true, tglEnd: true, createdAt: true },
  });

  const map = new Map<string, number>();
  for (const v of voyages) {
    const d = v.tglStart ?? v.tglEnd ?? v.createdAt;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }

  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  return Array.from(map.entries())
    .map(([key, count]) => {
      const [, m] = key.split("-");
      const monthIndex = Number(m) - 1;
      return {
        month: key,
        label: `${months[monthIndex] ?? m} ${key.split("-")[0]}`,
        count,
      };
    })
    .sort((a, b) => a.month.localeCompare(b.month));
}

export interface VoyagesPerShip {
  shipId: string;
  shipName: string;
  total: number;
  byMonth: Record<string, number>; // "2026-08" -> count
}

export async function getVoyagesPerShipMonthly(): Promise<VoyagesPerShip[]> {
  const [ships, voyages] = await Promise.all([
    prisma.ship.findMany({ orderBy: { nama: "asc" }, select: { id: true, nama: true } }),
    prisma.voyage.findMany({
      select: { shipId: true, tglStart: true, tglEnd: true, createdAt: true },
    }),
  ]);

  const monthKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

  const byShip = new Map<string, Record<string, number>>();
  for (const v of voyages) {
    const d = v.tglStart ?? v.tglEnd ?? v.createdAt;
    const key = monthKey(d);
    const map = byShip.get(v.shipId) ?? {};
    map[key] = (map[key] ?? 0) + 1;
    byShip.set(v.shipId, map);
  }

  return ships.map((s) => {
    const map = byShip.get(s.id) ?? {};
    return {
      shipId: s.id,
      shipName: s.nama,
      total: Object.values(map).reduce((a, b) => a + b, 0),
      byMonth: map,
    };
  });
}

export interface LongestActivity {
  aktivitas: string;
  status: ActivityStatus;
  days: number;
  from: Date;
  to: Date;
}

// Aktivitas terlama (deret hari sama terpanjang) dalam sebuah voyage.
export async function getLongestActivityPerVoyage(voyageId: string): Promise<LongestActivity | null> {
  const acts = await prisma.shipActivity.findMany({
    where: { voyageId },
    orderBy: [{ tanggal: "asc" }, { createdAt: "asc" }],
  });

  if (acts.length === 0) return null;

  let best: LongestActivity | null = null;
  let run: (typeof acts)[number][] = [];

  const flush = () => {
    if (run.length === 0) return;
    const first = run[0];
    const last = run[run.length - 1];
    const days = run.length;
    if (!best || days > best.days) {
      best = {
        aktivitas: first.aktivitas,
        status: first.status,
        days,
        from: first.tanggal,
        to: last.tanggal,
      };
    }
    run = [];
  };

  for (const act of acts) {
    if (run.length > 0 && run[0].aktivitas !== act.aktivitas) flush();
    run.push(act);
  }
  flush();

  return best;
}

export interface PersistedAlert {
  shipId: string;
  shipName: string;
  status: "kuning" | "merah";
  aktivitas: string;
  from: Date;
  to: Date;
  days: number;
}

// Kapal dengan aktivitas kuning/merah yang sama bertahan >= 2 hari berturut-turut.
export async function getPersistedAlerts(minDays = 2): Promise<PersistedAlert[]> {
  const ships = await prisma.ship.findMany({
    select: { id: true, nama: true },
    orderBy: { nama: "asc" },
  });

  const activities = await prisma.shipActivity.findMany({
    orderBy: [{ shipId: "asc" }, { tanggal: "asc" }, { createdAt: "asc" }],
  });

  const byShip = new Map<string, (typeof activities)[number][]>();
  for (const act of activities) {
    const arr = byShip.get(act.shipId) ?? [];
    arr.push(act);
    byShip.set(act.shipId, arr);
  }

  const alerts: PersistedAlert[] = [];

  for (const ship of ships) {
    const acts = byShip.get(ship.id) ?? [];
    let run: (typeof acts)[number][] = [];

    const flush = () => {
      if (run.length === 0) return;
      const status = run[0].status as "kuning" | "merah";
      if (status !== "kuning" && status !== "merah") {
        run = [];
        return;
      }
      if (run.length >= minDays) {
        alerts.push({
          shipId: ship.id,
          shipName: ship.nama,
          status,
          aktivitas: run[0].aktivitas,
          from: run[0].tanggal,
          to: run[run.length - 1].tanggal,
          days: run.length,
        });
      }
      run = [];
    };

    for (const act of acts) {
      if (run.length > 0 && run[0].aktivitas !== act.aktivitas) flush();
      run.push(act);
    }
    flush();
  }

  return alerts;
}