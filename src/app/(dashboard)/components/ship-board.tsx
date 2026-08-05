"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FileCheck2, FileX2, Fuel as FuelIcon, PenLine, Search, Ship, X } from "lucide-react";
import type { ShipWithStatus } from "@/lib/ship-status";
import { statusColor, statusText } from "@/lib/ship-status";
import { formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Filter = "semua" | "hijau" | "kuning" | "merah";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "semua", label: "Semua" },
  { key: "hijau", label: "Hijau" },
  { key: "kuning", label: "Kuning" },
  { key: "merah", label: "Merah" },
];

export function ShipBoard({ data }: { data: ShipWithStatus[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("semua");

  const filtered = useMemo(() => {
    return data.filter(({ ship, latest }) => {
      if (filter !== "semua" && latest?.status !== filter) return false;
      if (query && !ship.nama.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [data, query, filter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nama kapal..."
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors",
                filter === key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-accent",
              )}
            >
              {key !== "semua" && (
                <span className={cn("size-2 rounded-full", statusColor(key as "hijau" | "kuning" | "merah"))} />
              )}
              {label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          Tidak ada kapal yang cocok.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((card) => (
            <ShipCard key={card.ship.id} card={card} />
          ))}
        </div>
      )}
    </div>
  );
}

function ShipCard({ card }: { card: ShipWithStatus }) {
  const { ship, latest, fuelSisa, siAda, spalAda, stocks, ruteAsal, ruteTujuan, activities } = card;
  const [fuelOpen, setFuelOpen] = useState(false);
  const [activitiesOpen, setActivitiesOpen] = useState(false);

  const ruteLabel =
    ruteAsal || ruteTujuan
      ? `${ruteAsal || "?"} → ${ruteTujuan || "?"}`
      : null;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border bg-card p-4 transition-shadow hover:shadow-md">
      <span className={cn("absolute inset-y-0 left-0 w-1.5", statusColor(latest?.status ?? null))} />

      <div className="flex items-start justify-between gap-3 pl-1">
        <Link href={`/ships/${ship.id}`} className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Ship className="size-5 text-muted-foreground" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold leading-tight group-hover:underline">{ship.nama}</p>
            <p className="truncate text-sm text-muted-foreground">{ship.muatan || "Muatan tidak diisi"}</p>
          </div>
        </Link>
        <Badge
          className={cn(
            "shrink-0",
            latest?.status === "hijau" && "bg-emerald-500/15 text-emerald-600",
            latest?.status === "kuning" && "bg-amber-400/15 text-amber-600",
            latest?.status === "merah" && "bg-red-500/15 text-red-600",
          )}
        >
          {statusText(latest?.status ?? null)}
        </Badge>
      </div>

      <div className="mt-3 space-y-2 border-t pt-3 pl-1">
        <button
          type="button"
          onClick={() => setFuelOpen(true)}
          className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-left transition-colors hover:bg-muted"
        >
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <FuelIcon className="size-4" />
            Sisa Stok
          </span>
          <span className="flex items-center gap-2 text-sm font-semibold">
            {fuelSisa !== null ? `${formatNumber(fuelSisa)} L` : "Tidak ada"}
            {stocks.length > 0 && (
              <span className="text-xs font-normal text-muted-foreground">· lihat</span>
            )}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActivitiesOpen(true)}
          className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-left transition-colors hover:bg-muted"
        >
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <PenLine className="size-4" />
            Lihat Aktivitas
          </span>
          <span className="flex items-center gap-2 text-sm font-semibold">
            {activities.length > 0 ? `${activities.length} catatan` : "Tidak ada"}
            {activities.length > 0 && (
              <span className="text-xs font-normal text-muted-foreground">· lihat</span>
            )}
          </span>
        </button>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Dokumen:</span>
          {siAda ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-600">
              <FileCheck2 className="size-3.5" /> SI
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-600">
              <FileX2 className="size-3.5" /> SI
            </span>
          )}
          {spalAda ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-600">
              <FileCheck2 className="size-3.5" /> SPAL
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-600">
              <FileX2 className="size-3.5" /> SPAL
            </span>
          )}
        </div>

        {ruteLabel && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Rute:</span>
            <span className="truncate font-medium">{ruteLabel}</span>
          </div>
        )}
      </div>

      <div className="mt-3 border-t pt-3 pl-1 text-sm text-muted-foreground">
        <p className="truncate">
          {latest
            ? `${latest.aktivitas} — ${formatDate(latest.tanggal)}`
            : "Belum ada aktivitas"}
        </p>
      </div>

      {fuelOpen && (
        <FuelModal
          shipName={ship.nama}
          stocks={stocks}
          onClose={() => setFuelOpen(false)}
        />
      )}

      {activitiesOpen && (
        <ActivitiesModal
          shipName={ship.nama}
          activities={activities}
          onClose={() => setActivitiesOpen(false)}
        />
      )}
    </div>
  );
}

function ActivitiesModal({
  shipName,
  activities,
  onClose,
}: {
  shipName: string;
  activities: ShipWithStatus["activities"];
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
            <h3 className="font-semibold">Aktivitas Harian — {shipName}</h3>
            <p className="text-sm text-muted-foreground">Riwayat aktivitas terbaru.</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} title="Tutup">
            <X className="size-4" />
          </Button>
        </div>

        {activities.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Belum ada aktivitas.</p>
        ) : (
          <div className="space-y-1.5">
            {activities.slice(0, 50).map((act) => (
              <div key={act.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted/60">
                <span className={cn("size-2 shrink-0 rounded-full", statusColor(act.status))} />
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{act.aktivitas}</span>
                  {act.catatan && (
                    <span className="ml-2 truncate text-xs text-muted-foreground">{act.catatan}</span>
                  )}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{formatDate(act.tanggal)}</span>
              </div>
            ))}
            {activities.length > 50 && (
              <p className="pt-2 text-center text-xs text-muted-foreground">
                Menampilkan 50 dari {activities.length} catatan.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FuelModal({
  shipName,
  stocks,
  onClose,
}: {
  shipName: string;
  stocks: ShipWithStatus["stocks"];
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
            <h3 className="font-semibold">Fuel Harian — {shipName}</h3>
            <p className="text-sm text-muted-foreground">Riwayat pemakaian fuel (ME / AE).</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} title="Tutup">
            <X className="size-4" />
          </Button>
        </div>

        {stocks.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Belum ada data fuel.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead className="text-right">Awal</TableHead>
                <TableHead className="text-right">ME</TableHead>
                <TableHead className="text-right">AE</TableHead>
                <TableHead className="text-right">Sisa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stocks.map((rec) => (
                <TableRow key={rec.id}>
                  <TableCell>{formatDate(rec.tanggal)}</TableCell>
                  <TableCell className="text-right">{formatNumber(rec.stokAwal)}</TableCell>
                  <TableCell className="text-right">{formatNumber(rec.me)}</TableCell>
                  <TableCell className="text-right">{formatNumber(rec.ae)}</TableCell>
                  <TableCell className="text-right font-medium">{formatNumber(rec.sisaStok)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}