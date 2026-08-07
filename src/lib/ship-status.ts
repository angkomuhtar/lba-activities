import type { ActivityStatus } from "@prisma/client";

export type { ActivityStatus };

export type ShipWithStatus = {
  ship: { id: string; nama: string; muatan: string | null };
  latest: { status: ActivityStatus; aktivitas: string; tanggal: Date } | null;
  fuelSisa: string | null;
  siAda: boolean;
  spalAda: boolean;
  ruteAsal: string | null;
  ruteTujuan: string | null;
  activities: {
    id: string;
    status: ActivityStatus;
    aktivitas: string;
    tanggal: string;
    catatan: string | null;
  }[];
  stocks: {
    id: string;
    tanggal: string;
    stokAwal: string;
    me: string;
    ae: string;
    sisaStok: string;
  }[];
  refills: {
    id: string;
    tanggal: string;
    jumlah: string;
    catatan: string | null;
  }[];
};

export function statusColor(status: ActivityStatus | null): string {
  switch (status) {
    case "hijau":
      return "bg-emerald-500";
    case "kuning":
      return "bg-amber-400";
    case "merah":
      return "bg-red-500";
    default:
      return "bg-muted";
  }
}

export function statusText(status: ActivityStatus | null): string {
  switch (status) {
    case "hijau":
      return "Hijau";
    case "kuning":
      return "Kuning";
    case "merah":
      return "Merah";
    default:
      return "Belum ada aktivitas";
  }
}