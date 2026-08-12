"use client";

import { useTransition } from "react";
import type { StockRecord } from "@prisma/client";
import { Loader2, Trash2 } from "lucide-react";
import { deleteStock } from "@/app/actions/ships";
import { formatDate, formatNumber } from "@/lib/format";
import { paginate, usePage } from "@/lib/use-pagination";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface StockListProps {
  stocks: StockRecord[];
  canManage: boolean;
}

export function StockList({ stocks, canManage }: StockListProps) {
  const page = usePage();
  const { rows, page: safePage, totalPages } = paginate(stocks, page);

  if (stocks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Belum ada data fuel.</p>
    );
  }

  return (
    <div>
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
              <TableHead>Catatan</TableHead>
              {canManage && <TableHead className="text-right">Aksi</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((rec) => (
              <TableRow key={rec.id}>
                <TableCell>{formatDate(rec.tanggal)}</TableCell>
                <TableCell className="text-right">{formatNumber(rec.stokAwal)}</TableCell>
                <TableCell className="text-right">{formatNumber(rec.pengisian)}</TableCell>
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
      <Pagination page={safePage} totalPages={totalPages} />
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