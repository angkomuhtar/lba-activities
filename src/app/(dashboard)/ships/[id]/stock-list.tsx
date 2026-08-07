"use client";

import { useTransition } from "react";
import type { FuelRefill, StockRecord } from "@prisma/client";
import { Loader2, Trash2 } from "lucide-react";
import { deleteStock, deleteRefill } from "@/app/actions/ships";
import { formatDate, formatNumber } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface StockListProps {
  stocks: StockRecord[];
  refills: FuelRefill[];
  canManage: boolean;
}

function dateKey(value: Date | string): string {
  return new Date(value).toLocaleDateString("en-CA");
}

export function StockList({ stocks, refills, canManage }: StockListProps) {
  const refillByDay = new Map<string, string>();
  for (const r of refills) {
    const key = `${r.shipId}|${dateKey(r.tanggal)}`;
    refillByDay.set(key, (parseFloat(refillByDay.get(key) ?? "0") + parseFloat(r.jumlah.toString())).toString());
  }

  return (
    <div className="space-y-6">
      <div>
        {stocks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada data fuel.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Stok Awal</TableHead>
                  <TableHead className="text-right">Pengisian</TableHead>
                  <TableHead className="text-right">ME</TableHead>
                  <TableHead className="text-right">AE</TableHead>
                  <TableHead className="text-right">Sisa</TableHead>
                  {canManage && <TableHead className="text-right">Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {stocks.map((rec) => (
                  <TableRow key={rec.id}>
                    <TableCell>{formatDate(rec.tanggal)}</TableCell>
                    <TableCell className="text-right">{formatNumber(rec.stokAwal)}</TableCell>
                    <TableCell className="text-right">
                      {formatNumber(refillByDay.get(`${rec.shipId}|${dateKey(rec.tanggal)}`) ?? "0")}
                    </TableCell>
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

      {refills.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Pengisian Fuel</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead>Catatan</TableHead>
                  {canManage && <TableHead className="text-right">Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {refills.map((rf) => (
                  <TableRow key={rf.id}>
                    <TableCell>{formatDate(rf.tanggal)}</TableCell>
                    <TableCell className="text-right font-medium">{formatNumber(rf.jumlah)} L</TableCell>
                    <TableCell className="max-w-56 truncate text-sm text-muted-foreground">{rf.catatan ?? "-"}</TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        <DeleteRefillButton id={rf.id} />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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

function DeleteRefillButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      title="Hapus data pengisian"
      disabled={pending}
      onClick={() => {
        if (!confirm("Hapus data pengisian ini?")) return;
        startTransition(async () => {
          await deleteRefill(id);
        });
      }}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
    </Button>
  );
}