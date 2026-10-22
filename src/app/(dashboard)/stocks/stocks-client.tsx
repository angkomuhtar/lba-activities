"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { ArrowLeftRight, Download, Loader2, Trash2 } from "lucide-react";
import {
  createStock,
  createFuelTransfer,
  deleteStock,
  deleteFuelTransfer,
  type ActionResult,
} from "@/app/actions/ships";
import { formatDate, formatNumber } from "@/lib/format";
import { paginate, usePage } from "@/lib/use-pagination";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface TransferRow {
  id: string;
  tanggal: string;
  fromShipId: string;
  fromShipName: string;
  toShipId: string;
  toShipName: string;
  jumlah: string;
  catatan: string | null;
}

interface StockRow {
  id: string;
  shipId: string;
  tanggal: string;
  stokAwal: string;
  pengisian: string;
  transferMasuk: string;
  transferKeluar: string;
  me: string;
  ae: string;
  sisaStok: string;
  catatan: string | null;
  ship: { nama: string };
}

interface StocksClientProps {
  ships: { id: string; nama: string }[];
  stocks: StockRow[];
  transfers: TransferRow[];
  prevByShip: Map<string, string>;
  canManage: boolean;
  defaultFrom: string;
  defaultTo: string;
}

export function StocksClient({
  ships,
  stocks,
  transfers,
  prevByShip,
  canManage,
  defaultFrom,
  defaultTo,
}: StocksClientProps) {
  const [tab, setTab] = useState<"input" | "transfer">("input");
  const [shipId, setShipId] = useState(ships[0]?.id ?? "");
  const [exportFrom, setExportFrom] = useState(defaultFrom);
  const [exportTo, setExportTo] = useState(defaultTo);

  const handleExport = () => {
    const params = new URLSearchParams();
    if (exportFrom) params.set("from", exportFrom);
    if (exportTo) params.set("to", exportTo);
    if (shipId) params.set("shipId", shipId);
    window.location.href = `/api/fuel/export?${params.toString()}`;
  };

  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    (prev, formData) => createStock(shipId, prev, formData),
    undefined,
  );

  const [transferState, transferAction, transferPending] = useActionState<
    ActionResult,
    FormData
  >(createFuelTransfer, undefined);

  const [transferFrom, setTransferFrom] = useState(ships[0]?.id ?? "");
  const [transferTo, setTransferTo] = useState(ships[1]?.id ?? ships[0]?.id ?? "");

  const prevSisa = shipId ? prevByShip.get(shipId) ?? null : null;
  const hasPrevious = prevSisa !== null;

  const filtered = useMemo(
    () => (shipId ? stocks.filter((s) => s.shipId === shipId) : stocks),
    [stocks, shipId],
  );

  const page = usePage();
  const { rows, page: safePage, totalPages } = paginate(filtered, page);

  const transferPage = usePage();
  const {
    rows: transferRows,
    page: transferSafePage,
    totalPages: transferTotalPages,
  } = paginate(transfers, transferPage);

  const fromSisa = transferFrom ? prevByShip.get(transferFrom) ?? null : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Input Fuel Harian</h1>
        <p className="text-sm text-muted-foreground">
          Catat pemakaian fuel (ME / AE) dan pengisian, atau transfer stok fuel antar kapal.
          Stok awal otomatis dari sisa terakhir; sisa = stok awal + pengisian + transfer masuk − ME − AE − transfer keluar.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab("input")}
          className={cn(
            "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
            tab === "input"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-muted-foreground hover:bg-accent",
          )}
        >
          Input Fuel
        </button>
        <button
          type="button"
          onClick={() => setTab("transfer")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
            tab === "transfer"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-muted-foreground hover:bg-accent",
          )}
        >
          <ArrowLeftRight className="size-4" />
          Transfer Fuel
        </button>
      </div>

      {tab === "input" ? (
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="tanggal">Tanggal</Label>
                  <Input id="tanggal" name="tanggal" type="date" required disabled={!canManage} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pengisian">Pengisian (L)</Label>
                  <Input id="pengisian" name="pengisian" type="number" min="0" step="0.001" placeholder="0" defaultValue="0" disabled={!canManage} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                  <Input key="stok-awal-auto" id="stokAwal" name="stokAwal" value={prevSisa} disabled readOnly className="text-muted-foreground" />
                ) : (
                  <Input
                    key="stok-awal-manual"
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

              <div className="space-y-2">
                <Label htmlFor="catatan">Catatan (opsional)</Label>
                <Input id="catatan" name="catatan" placeholder="Contoh: isi solar, pemakaian mesin, dll." disabled={!canManage} />
              </div>

              <p className="text-xs text-muted-foreground">
                {hasPrevious
                  ? `Stok awal otomatis = sisa terakhir (${prevSisa}). Sisa = stok awal + pengisian + transfer masuk − ME − AE − transfer keluar.`
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

              <div className="flex flex-wrap items-end gap-3 border-b px-4 py-3">
                <div className="space-y-1">
                  <Label htmlFor="export-from" className="text-xs text-muted-foreground">
                    Dari Tanggal
                  </Label>
                  <Input
                    id="export-from"
                    type="date"
                    value={exportFrom}
                    onChange={(e) => setExportFrom(e.target.value)}
                    className="h-9 w-40"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="export-to" className="text-xs text-muted-foreground">
                    Sampai Tanggal
                  </Label>
                  <Input
                    id="export-to"
                    type="date"
                    value={exportTo}
                    onChange={(e) => setExportTo(e.target.value)}
                    className="h-9 w-40"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleExport}
                  disabled={!exportFrom || !exportTo}
                >
                  <Download className="size-4" />
                  Export Excel
                </Button>
                <p className="text-xs text-muted-foreground">
                  {shipId ? "Sesuai filter kapal yang dipilih." : "Semua kapal."}
                </p>
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
                        <TableHead className="text-right">Pengisian</TableHead>
                        <TableHead className="text-right">Trf Masuk</TableHead>
                        <TableHead className="text-right">Trf Keluar</TableHead>
                        <TableHead className="text-right">ME</TableHead>
                        <TableHead className="text-right">AE</TableHead>
                        <TableHead className="text-right">Sisa</TableHead>
                        <TableHead>Catatan</TableHead>
                        {canManage && <TableHead className="text-right">Aksi</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((rec) => (
                        <TableRow key={rec.id}>
                          <TableCell>{formatDate(rec.tanggal)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{rec.ship.nama}</TableCell>
                          <TableCell className="text-right">{formatNumber(rec.stokAwal)}</TableCell>
                          <TableCell className="text-right">{formatNumber(rec.pengisian)}</TableCell>
                          <TableCell className="text-right text-emerald-600">
                            {rec.transferMasuk.toString() === "0" ? "-" : formatNumber(rec.transferMasuk)}
                          </TableCell>
                          <TableCell className="text-right text-amber-600">
                            {rec.transferKeluar.toString() === "0" ? "-" : formatNumber(rec.transferKeluar)}
                          </TableCell>
                          <TableCell className="text-right">{formatNumber(rec.me)}</TableCell>
                          <TableCell className="text-right">{formatNumber(rec.ae)}</TableCell>
                          <TableCell className="text-right font-medium">{formatNumber(rec.sisaStok)}</TableCell>
                          <TableCell className="max-w-48 truncate text-sm text-muted-foreground">{rec.catatan ?? "-"}</TableCell>
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
              {filtered.length > 0 && <Pagination page={safePage} totalPages={totalPages} />}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <form action={transferAction} className="space-y-4 rounded-xl border bg-background p-4">
              {transferState?.error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {transferState.error}
                </p>
              )}
              {transferState?.success && (
                <p className="rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600">
                  {transferState.success}
                </p>
              )}

              <div className="space-y-2">
                <Label htmlFor="fromShipId">Kapal Asal</Label>
                <select
                  id="fromShipId"
                  name="fromShipId"
                  value={transferFrom}
                  onChange={(e) => setTransferFrom(e.target.value)}
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
                {fromSisa !== null && (
                  <p className="text-xs text-muted-foreground">Sisa stok saat ini: {formatNumber(fromSisa)} L</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="toShipId">Kapal Tujuan</Label>
                <select
                  id="toShipId"
                  name="toShipId"
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="transfer-tanggal">Tanggal</Label>
                  <Input id="transfer-tanggal" name="tanggal" type="date" required disabled={!canManage} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jumlah">Jumlah (L)</Label>
                  <Input id="jumlah" name="jumlah" type="number" min="0.001" step="0.001" placeholder="0" required disabled={!canManage} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transfer-catatan">Catatan (opsional)</Label>
                <Input id="transfer-catatan" name="catatan" placeholder="Contoh: bantuan solar" disabled={!canManage} />
              </div>

              {transferFrom === transferTo && ships.length > 1 && (
                <p className="text-xs text-destructive">Kapal asal dan tujuan harus berbeda.</p>
              )}

              {canManage ? (
                <Button
                  type="submit"
                  className="w-full"
                  disabled={transferPending || !transferFrom || !transferTo || transferFrom === transferTo}
                >
                  {transferPending && <Loader2 className="size-4 animate-spin" />}
                  Transfer Fuel
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Anda tidak memiliki izin untuk transfer fuel.
                </p>
              )}
            </form>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-xl border bg-background">
              <div className="border-b px-4 py-3">
                <h2 className="font-semibold">Riwayat Transfer</h2>
              </div>
              {transfers.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Belum ada transfer fuel.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Dari</TableHead>
                        <TableHead>Tujuan</TableHead>
                        <TableHead className="text-right">Jumlah (L)</TableHead>
                        <TableHead>Catatan</TableHead>
                        {canManage && <TableHead className="text-right">Aksi</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transferRows.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell>{formatDate(t.tanggal)}</TableCell>
                          <TableCell className="text-sm">{t.fromShipName}</TableCell>
                          <TableCell className="text-sm">{t.toShipName}</TableCell>
                          <TableCell className="text-right font-medium">{formatNumber(t.jumlah)}</TableCell>
                          <TableCell className="max-w-48 truncate text-sm text-muted-foreground">
                            {t.catatan ?? "-"}
                          </TableCell>
                          {canManage && (
                            <TableCell className="text-right">
                              <DeleteTransferButton id={t.id} />
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {transfers.length > 0 && (
                <Pagination page={transferSafePage} totalPages={transferTotalPages} />
              )}
            </div>
          </div>
        </div>
      )}
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

function DeleteTransferButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      title="Hapus transfer"
      disabled={pending}
      onClick={() => {
        if (!confirm("Hapus transfer ini? Sisa stok kedua kapal akan disesuaikan.")) return;
        startTransition(async () => {
          await deleteFuelTransfer(id);
        });
      }}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
    </Button>
  );
}
