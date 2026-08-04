"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import type { StockRecord } from "@prisma/client";
import { Loader2, Trash2 } from "lucide-react";
import { createStock, deleteStock, type ActionResult } from "@/app/actions/ships";
import { formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface StocksClientProps {
  ships: { id: string; nama: string }[];
  stocks: (StockRecord & { ship: { nama: string } })[];
  prevByShip: Map<string, string>;
  canManage: boolean;
}

export function StocksClient({ ships, stocks, prevByShip, canManage }: StocksClientProps) {
  const [shipId, setShipId] = useState(ships[0]?.id ?? "");
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    (prev, formData) => createStock(shipId, prev, formData),
    undefined,
  );

  const prevSisa = shipId ? prevByShip.get(shipId) ?? null : null;
  const hasPrevious = prevSisa !== null;

  const filtered = useMemo(
    () => (shipId ? stocks.filter((s) => s.shipId === shipId) : stocks),
    [stocks, shipId],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Input Fuel Harian</h1>
        <p className="text-sm text-muted-foreground">
          Catat pemakaian fuel (ME / AE). Stok awal otomatis dari sisa kemarin; sisa = stok awal − ME − AE.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <form action={formAction} className="space-y-4 rounded-xl border bg-background p-4">
            {state?.error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {state.error}
              </p>
            )}
            {state?.success && (
              <p className="rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600">
                {state.success}
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="kapal">Kapal</Label>
              <select
                id="kapal"
                value={shipId}
                onChange={(e) => setShipId(e.target.value)}
                required
                disabled={!canManage || ships.length === 0}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                {ships.length === 0 && <option value="">Belum ada kapal</option>}
                {ships.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="tanggal">Tanggal</Label>
                <Input id="tanggal" name="tanggal" type="date" required disabled={!canManage} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="me">ME</Label>
                <Input id="me" name="me" type="number" min="0" step="0.001" placeholder="0" required disabled={!canManage} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ae">AE</Label>
                <Input id="ae" name="ae" type="number" min="0" step="0.001" placeholder="0" required disabled={!canManage} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stokAwal">Stok Awal</Label>
              {hasPrevious ? (
                <Input id="stokAwal" name="stokAwal" value={prevSisa} disabled readOnly className="text-muted-foreground" />
              ) : (
                <Input
                  id="stokAwal"
                  name="stokAwal"
                  type="number"
                  min="0"
                  step="0.001"
                  placeholder="Isi stok awal (data pertama)"
                  required
                  disabled={!canManage}
                />
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              {hasPrevious
                ? `Stok awal otomatis = sisa kemarin (${prevSisa}). Sisa = stok awal − ME − AE.`
                : "Belum ada data sebelumnya untuk kapal ini. Isi stok awal manual."}
            </p>

            {canManage ? (
              <Button type="submit" className="w-full" disabled={pending || !shipId}>
                {pending && <Loader2 className="size-4 animate-spin" />}
                Simpan Fuel
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Anda tidak memiliki izin untuk input fuel.
              </p>
            )}
          </form>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-xl border bg-background">
            <div className="border-b px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold">Riwayat Fuel</h2>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setShipId("")}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs transition-colors",
                      !shipId
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:bg-accent",
                    )}
                  >
                    Semua
                  </button>
                  {ships.slice(0, 8).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setShipId(s.id)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs transition-colors",
                        shipId === s.id
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:bg-accent",
                      )}
                    >
                      {s.nama}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {filtered.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">Belum ada data fuel.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Kapal</TableHead>
                      <TableHead className="text-right">Stok Awal</TableHead>
                      <TableHead className="text-right">ME</TableHead>
                      <TableHead className="text-right">AE</TableHead>
                      <TableHead className="text-right">Sisa</TableHead>
                      {canManage && <TableHead className="text-right">Aksi</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((rec) => (
                      <TableRow key={rec.id}>
                        <TableCell>{formatDate(rec.tanggal)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{rec.ship.nama}</TableCell>
                        <TableCell className="text-right">{formatNumber(rec.stokAwal)}</TableCell>
                        <TableCell className="text-right">{formatNumber(rec.me)}</TableCell>
                        <TableCell className="text-right">{formatNumber(rec.ae)}</TableCell>
                        <TableCell className="text-right font-medium">{formatNumber(rec.sisaStok)}</TableCell>
                        {canManage && (
                          <TableCell className="text-right">
                            <DeleteStockButton id={rec.id} />
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DeleteStockButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      title="Hapus data fuel"
      disabled={pending}
      onClick={() => {
        if (!confirm("Hapus data fuel ini?")) return;
        startTransition(async () => {
          await deleteStock(id);
        });
      }}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
    </Button>
  );
}