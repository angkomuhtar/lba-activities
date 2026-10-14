import "server-only";

import { prisma } from "@/lib/prisma";
import { jettyLabel, ruteLabel } from "@/lib/jetties";
import type { ActivityStatus, PaymentStatus } from "@prisma/client";

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

export interface ActiveVoyage {
  id: string;
  ruteAsal: string | null;
  ruteTujuan: string | null;
  tglStart: Date | null;
}

// Voyage yang masih berjalan (belum diselesaikan = tglEnd kosong) per kapal.
// Dipakai untuk cegah voyage ganda aktif pada kapal yang sama.
export async function findActiveVoyagesByShip(
  shipId: string,
): Promise<ActiveVoyage[]> {
  const voyages = await prisma.voyage.findMany({
    where: { shipId, tglEnd: null },
    orderBy: [{ tglStart: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      tglStart: true,
      ruteAsalJetty: { select: { nama: true, location: true } },
      ruteTujuanJetty: { select: { nama: true, location: true } },
    },
  });
  return voyages.map((v) => ({
    id: v.id,
    ruteAsal: v.ruteAsalJetty ? jettyLabel(v.ruteAsalJetty) : null,
    ruteTujuan: v.ruteTujuanJetty ? jettyLabel(v.ruteTujuanJetty) : null,
    tglStart: v.tglStart,
  }));
}

export function activeVoyageLabel(v: ActiveVoyage): string {
  const rute =
    v.ruteAsal || v.ruteTujuan
      ? `${v.ruteAsal || "?"} → ${v.ruteTujuan || "?"}`
      : "tanpa rute";
  const start = v.tglStart ? v.tglStart.toLocaleDateString("id-ID") : "belum mulai";
  return `${rute} (mulai ${start})`;
}

// Voyage yang terakhir selesai (tglEnd paling akhir) untuk kapal tertentu,
// dipakai untuk memeriksa voyage baru tidak mulai sebelum voyage selesai.
export async function findLatestFinishedVoyage(
  shipId: string,
): Promise<{ id: string; ruteAsal: string | null; ruteTujuan: string | null; tglEnd: Date } | null> {
  const v = await prisma.voyage.findFirst({
    where: { shipId, tglEnd: { not: null } },
    orderBy: { tglEnd: "desc" },
    select: {
      id: true,
      tglEnd: true,
      ruteAsalJetty: { select: { nama: true, location: true } },
      ruteTujuanJetty: { select: { nama: true, location: true } },
    },
  });
  if (!v?.tglEnd) return null;
  return {
    id: v.id,
    ruteAsal: v.ruteAsalJetty ? jettyLabel(v.ruteAsalJetty) : null,
    ruteTujuan: v.ruteTujuanJetty ? jettyLabel(v.ruteTujuanJetty) : null,
    tglEnd: v.tglEnd,
  };
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

export interface UnpaidVoyage {
  id: string;
  shipId: string;
  shipName: string;
  rute: string;
  statusBayar: PaymentStatus | null;
  invoiceNomor: string | null;
  selesai: boolean;
}

// Pelayaran yang belum lunas (Belum Ada / DP).
export async function getUnpaidVoyages(): Promise<UnpaidVoyage[]> {
  const voyages = await prisma.voyage.findMany({
    where: { OR: [{ statusBayar: null }, { statusBayar: "DP" }] },
    include: {
      ship: { select: { nama: true } },
      ruteAsalJetty: { select: { nama: true, location: true } },
      ruteTujuanJetty: { select: { nama: true, location: true } },
    },
    orderBy: [{ tglStart: "desc" }, { createdAt: "desc" }],
  });

  return voyages.map((v) => {
    const rute = ruteLabel(v.ruteAsalJetty, v.ruteTujuanJetty, v.siNomor ? `SI ${v.siNomor}` : null);
    return {
      id: v.id,
      shipId: v.shipId,
      shipName: v.ship.nama,
      rute,
      statusBayar: v.statusBayar,
      invoiceNomor: v.invoiceNomor,
      selesai: Boolean(v.tglEnd),
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

export interface VoyageTrip {
  id: string;
  shipId: string;
  shipName: string;
  rute: string;
  ruteAsalId: string | null;
  ruteTujuanId: string | null;
  tglStart: string | null;
  tglEnd: string | null;
  jumlahHari: number | null;
  activityCount: number;
  totalFuel: number | null;
}

// Jumlah hari = cacah tanggal unik dari aktivitas voyage (2 aktivitas di hari
// yang sama tetap dihitung 1 hari). Null bila voyage belum punya aktivitas.
function jumlahHariAktivitas(dates: Date[]): number | null {
  if (dates.length === 0) return null;
  const days = new Set<number>();
  for (const d of dates) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    days.add(x.getTime());
  }
  return days.size;
}

export async function getVoyageTrips(): Promise<VoyageTrip[]> {
  const [voyages, stocks] = await Promise.all([
    prisma.voyage.findMany({
      include: {
        ship: { select: { nama: true } },
        ruteAsalJetty: { select: { nama: true, location: true } },
        ruteTujuanJetty: { select: { nama: true, location: true } },
        activities: { select: { tanggal: true } },
      },
      orderBy: [{ tglStart: "desc" }, { createdAt: "desc" }],
    }),
    // Pemakaian fuel harian (ME + AE) per kapal, dijumlahkan per voyage
    // berdasarkan rentang tanggal voyage.
    prisma.stockRecord.findMany({
      select: { shipId: true, tanggal: true, me: true, ae: true },
    }),
  ]);

  const fuelByShip = new Map<string, { tanggal: Date; total: number }[]>();
  for (const s of stocks) {
    const arr = fuelByShip.get(s.shipId) ?? [];
    arr.push({ tanggal: s.tanggal, total: Number(s.me) + Number(s.ae) });
    fuelByShip.set(s.shipId, arr);
  }

  return voyages.map((v) => {
    const rute = ruteLabel(v.ruteAsalJetty, v.ruteTujuanJetty, v.siNomor ? `SI ${v.siNomor}` : null);

    let totalFuel: number | null = null;
    if (v.tglStart) {
      const start = new Date(v.tglStart);
      start.setHours(0, 0, 0, 0);
      const end = new Date(v.tglEnd ?? new Date());
      end.setHours(23, 59, 59, 999);
      const inRange = (fuelByShip.get(v.shipId) ?? []).filter(
        (r) => r.tanggal >= start && r.tanggal <= end,
      );
      if (inRange.length > 0) {
        totalFuel = inRange.reduce((sum, r) => sum + r.total, 0);
      }
    }

    return {
      id: v.id,
      shipId: v.shipId,
      shipName: v.ship.nama,
      rute,
      ruteAsalId: v.ruteAsalId,
      ruteTujuanId: v.ruteTujuanId,
      tglStart: v.tglStart ? v.tglStart.toISOString() : null,
      tglEnd: v.tglEnd ? v.tglEnd.toISOString() : null,
      jumlahHari: jumlahHariAktivitas(v.activities.map((a) => a.tanggal)),
      activityCount: v.activities.length,
      totalFuel,
    };
  });
}

export async function getVoyageActivities(voyageId: string) {
  const acts = await prisma.shipActivity.findMany({
    where: { voyageId },
    orderBy: [{ tanggal: "asc" }, { createdAt: "asc" }],
    select: { id: true, tanggal: true, aktivitas: true, status: true, catatan: true },
  });
  return acts.map((a) => ({
    id: a.id,
    tanggal: a.tanggal.toISOString(),
    aktivitas: a.aktivitas,
    status: a.status as ActivityStatus,
    catatan: a.catatan,
  }));
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

// Kapal dengan aktivitas kuning/merah yang sama bertahan >= minDays hari berturut-turut
// SAMPAI HARI INI (hanya status yang masih berlangsung hari ini yang ditampilkan).
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isSameDay = (a: Date) => {
    const d = new Date(a);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  };

  const alerts: PersistedAlert[] = [];

  for (const ship of ships) {
    const acts = byShip.get(ship.id) ?? [];
    if (acts.length === 0) continue;

    // Ambil hanya deret (run) terakhir — status yang masih berlangsung hari ini.
    const last = acts[acts.length - 1];
    if (!isSameDay(last.tanggal)) continue; // tidak ada catatan hari ini, lewati

    const status = last.status as "kuning" | "merah";
    if (status !== "merah") continue; // hanya status merah

    const run: (typeof acts)[number][] = [last];
    for (let i = acts.length - 2; i >= 0; i--) {
      const act = acts[i];
      if (act.aktivitas !== last.aktivitas) break;
      run.unshift(act);
    }

    // "Waiting Dokumen" baru muncul setelah 3 hari, aktivitas lain 2 hari.
    const requiredDays = last.aktivitas === "Waiting Dokumen" ? 3 : minDays;

    if (run.length >= requiredDays) {
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
  }

  return alerts;
}