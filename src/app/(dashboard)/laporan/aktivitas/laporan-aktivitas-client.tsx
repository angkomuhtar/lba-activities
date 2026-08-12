"use client";

import { useMemo, useState } from "react";
import { Download, Printer, X } from "lucide-react";
import type { ActivityStatus } from "@prisma/client";
import { statusColor, statusText } from "@/lib/ship-status";
import { formatDate } from "@/lib/format";
import { paginate, usePage } from "@/lib/use-pagination";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface LaporanAktivitasClientProps {
  ships: { id: string; nama: string }[];
  activities: {
    id: string;
    shipId: string;
    shipName: string;
    tanggal: string;
    aktivitas: string;
    status: ActivityStatus;
    catatan: string | null;
    voyageLabel: string | null;
  }[];
}

type ActivityItem = LaporanAktivitasClientProps["activities"][number];

type LaporanRow = {
  shipId: string;
  shipName: string;
  voyageLabel: string | null;
  aktivitas: string;
  items: ActivityItem[];
};

function buildRows(activities: ActivityItem[]): LaporanRow[] {
  const rows: LaporanRow[] = [];
  const byKey = new Map<string, LaporanRow>();
  for (const a of activities) {
    const key = `${a.shipId}|${a.voyageLabel ?? ""}|${a.aktivitas}`;
    let row = byKey.get(key);
    if (!row) {
      row = {
        shipId: a.shipId,
        shipName: a.shipName,
        voyageLabel: a.voyageLabel,
        aktivitas: a.aktivitas,
        items: [],
      };
      byKey.set(key, row);
      rows.push(row);
    }
    row.items.push(a);
  }
  return rows;
}

export function LaporanAktivitasClient({ ships, activities }: LaporanAktivitasClientProps) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [shipId, setShipId] = useState("all");
  const [aktivitas, setAktivitas] = useState("all");
  const [status, setStatus] = useState<"all" | ActivityStatus>("all");
  const [detail, setDetail] = useState<LaporanRow | null>(null);

  const aktivitasOptions = useMemo(
    () => Array.from(new Set(activities.map((a) => a.aktivitas).filter(Boolean))).sort(),
    [activities],
  );

  const filtered = useMemo(() => {
    const fromTime = from ? new Date(`${from}T00:00:00`).getTime() : null;
    const toTime = to ? new Date(`${to}T23:59:59.999`).getTime() : null;
    return activities.filter((a) => {
      if (shipId !== "all" && a.shipId !== shipId) return false;
      if (aktivitas !== "all" && a.aktivitas !== aktivitas) return false;
      if (status !== "all" && a.status !== status) return false;
      const t = new Date(a.tanggal).getTime();
      if (fromTime !== null && t < fromTime) return false;
      if (toTime !== null && t > toTime) return false;
      return true;
    });
  }, [activities, from, to, shipId, aktivitas, status]);

  const total = filtered.length;
  const count = (s: ActivityStatus) => filtered.filter((a) => a.status === s).length;

  const groupedRows = useMemo(() => buildRows(filtered), [filtered]);

  const page = usePage();
  const { rows, page: safePage, totalPages } = paginate(groupedRows, page);

  const summary = [
    { label: "Total", value: total, className: "" },
    { label: "Hijau", value: count("hijau"), className: "text-emerald-600" },
    { label: "Kuning", value: count("kuning"), className: "text-amber-600" },
    { label: "Merah", value: count("merah"), className: "text-red-600" },
  ];

  const handlePrint = () => window.print();
  const handleExportCsv = () => {
    const csvRows = [
      ["Tanggal", "Kapal", "Voyage", "Aktivitas", "Status", "Catatan"],
      ...filtered.map((a) => [
        formatDate(a.tanggal),
        a.shipName,
        a.voyageLabel ?? "-",
        a.aktivitas,
        statusText(a.status),
        a.catatan ?? "",
      ]),
    ];
    const csv = csvRows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "laporan-aktivitas.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold">Laporan Aktivitas</h1>
          <p className="text-sm text-muted-foreground">
            Rekap aktivitas harian kapal per rute. Filter berdasarkan periode & kapal.
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button type="button" variant="outline" size="sm" onClick={handleExportCsv}>
            <Download className="size-4" />
            Export CSV
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="size-4" />
            Cetak
          </Button>
        </div>
      </div>

      <div className="grid gap-4 rounded-xl border bg-background p-4 sm:grid-cols-2 print:hidden">
        <div className="space-y-2">
          <Label htmlFor="from">Dari Tanggal</Label>
          <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="to">Sampai Tanggal</Label>
          <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ship">Kapal</Label>
          <select
            id="ship"
            value={shipId}
            onChange={(e) => setShipId(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="all">Semua Kapal</option>
            {ships.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nama}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="aktivitas">Aktivitas</Label>
          <select
            id="aktivitas"
            value={aktivitas}
            onChange={(e) => setAktivitas(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="all">Semua Aktivitas</option>
            {aktivitasOptions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as "all" | ActivityStatus)}
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="all">Semua Status</option>
            <option value="hijau">Hijau</option>
            <option value="kuning">Kuning</option>
            <option value="merah">Merah</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {summary.map((s) => (
          <div key={s.label} className="rounded-xl border bg-background p-4">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className={cn("text-2xl font-bold", s.className)}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-background">
        <div className="border-b px-4 py-3">
          <h2 className="font-semibold">Detail Aktivitas</h2>
        </div>
        {groupedRows.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            Tidak ada aktivitas pada periode & filter yang dipilih.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kapal</TableHead>
                  <TableHead>Rute</TableHead>
                  <TableHead>Aktivitas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Hari</TableHead>
                  <TableHead className="text-right print:hidden">Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const hari = new Set(r.items.map((i) => i.tanggal.slice(0, 10))).size;
                  const statusCounts: Record<ActivityStatus, number> = {
                    hijau: 0,
                    kuning: 0,
                    merah: 0,
                  };
                  for (const i of r.items) statusCounts[i.status]++;
                  return (
                    <TableRow key={`${r.shipId}|${r.voyageLabel ?? ""}|${r.aktivitas}`}>
                      <TableCell className="font-medium">{r.shipName}</TableCell>
                      <TableCell className="max-w-48 truncate text-sm text-muted-foreground">
                        {r.voyageLabel ?? "-"}
                      </TableCell>
                      <TableCell>{r.aktivitas}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(["hijau", "kuning", "merah"] as ActivityStatus[]).map(
                            (s) =>
                              statusCounts[s] > 0 && (
                                <Badge
                                  key={s}
                                  className={cn(
                                    "border-0 text-white",
                                    s === "hijau" && "bg-emerald-500",
                                    s === "kuning" && "bg-amber-400",
                                    s === "merah" && "bg-red-500",
                                  )}
                                >
                                  {statusText(s)}
                                </Badge>
                              ),
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{hari}</TableCell>
                      <TableCell className="text-right print:hidden">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setDetail(r)}
                        >
                          Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        {groupedRows.length > 0 && <Pagination page={safePage} totalPages={totalPages} />}
      </div>

      {detail && <AktivitasDetailModal row={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

function AktivitasDetailModal({
  row,
  onClose,
}: {
  row: LaporanRow;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[80vh] w-full max-w-lg overflow-auto rounded-xl border bg-background p-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="font-semibold">
              {row.shipName} — {row.aktivitas}
            </h3>
            <p className="text-sm text-muted-foreground">
              {row.voyageLabel ?? "Tanpa Voyage"} · {row.items.length} hari
            </p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} title="Tutup">
            <X className="size-4" />
          </Button>
        </div>

        <div className="space-y-1.5">
          {row.items.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted/60"
            >
              <span className={cn("size-2 shrink-0 rounded-full", statusColor(a.status))} />
              <span className="shrink-0 font-medium whitespace-nowrap">{formatDate(a.tanggal)}</span>
              <Badge
                className={cn(
                  "shrink-0 border-0",
                  a.status === "hijau" && "bg-emerald-500/15 text-emerald-600",
                  a.status === "kuning" && "bg-amber-400/15 text-amber-600",
                  a.status === "merah" && "bg-red-500/15 text-red-600",
                )}
              >
                {statusText(a.status)}
              </Badge>
              {a.catatan && (
                <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                  {a.catatan}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}