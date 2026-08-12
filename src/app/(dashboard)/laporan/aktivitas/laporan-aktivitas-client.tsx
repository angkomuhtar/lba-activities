"use client";

import { useMemo, useState } from "react";
import { Download, Printer } from "lucide-react";
import type { ActivityStatus } from "@prisma/client";
import { statusText } from "@/lib/ship-status";
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

export function LaporanAktivitasClient({ ships, activities }: LaporanAktivitasClientProps) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [shipId, setShipId] = useState("all");
  const [aktivitas, setAktivitas] = useState("all");
  const [status, setStatus] = useState<"all" | ActivityStatus>("all");

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

  const page = usePage();
  const { rows, page: safePage, totalPages } = paginate(filtered, page);

  const summary = [
    { label: "Total", value: total, className: "" },
    { label: "Hijau", value: count("hijau"), className: "text-emerald-600" },
    { label: "Kuning", value: count("kuning"), className: "text-amber-600" },
    { label: "Merah", value: count("merah"), className: "text-red-600" },
  ];

  const handlePrint = () => window.print();
  const handleExportCsv = () => {
    const rows = [
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
    const csv = rows
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
            Rekap aktivitas harian kapal. Filter berdasarkan periode & kapal.
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
        {filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            Tidak ada aktivitas pada periode & filter yang dipilih.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Kapal</TableHead>
                  <TableHead>Voyage</TableHead>
                  <TableHead>Aktivitas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Catatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="whitespace-nowrap">{formatDate(a.tanggal)}</TableCell>
                    <TableCell className="font-medium">{a.shipName}</TableCell>
                    <TableCell className="max-w-48 truncate text-sm text-muted-foreground">
                      {a.voyageLabel ?? "-"}
                    </TableCell>
                    <TableCell>{a.aktivitas}</TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          a.status === "hijau" && "bg-emerald-500/15 text-emerald-600",
                          a.status === "kuning" && "bg-amber-400/15 text-amber-600",
                          a.status === "merah" && "bg-red-500/15 text-red-600",
                        )}
                      >
                        {statusText(a.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-56 truncate text-sm text-muted-foreground">
                      {a.catatan ?? "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {filtered.length > 0 && <Pagination page={safePage} totalPages={totalPages} />}
      </div>
    </div>
  );
}
