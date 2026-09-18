"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { formatDate } from "@/lib/format";
import { paginate, usePage } from "@/lib/use-pagination";
import { cn } from "@/lib/utils";
import type { VoyageTrip } from "@/lib/voyages";
import { getTripActivities } from "@/app/actions/ships";
import { statusColor } from "@/lib/ship-status";

export function VoyageTripReport({ trips }: { trips: VoyageTrip[] }) {
  const tripPage = usePage("tripPage");
  const { rows: tripRows, page: tripSafe, totalPages: tripPages } = paginate(trips, tripPage, 10);
  const [activities, setActivities] = useState<Awaited<ReturnType<typeof getTripActivities>> | null>(null);
  const [loading, setLoading] = useState(false);

  const loadActivities = async (id: string) => {
    setLoading(true);
    const data = await getTripActivities(id);
    setActivities(data);
    setLoading(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Perjalanan Terakhir</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kapal</TableHead>
                <TableHead>Rute</TableHead>
                <TableHead>Mulai</TableHead>
                <TableHead>Selesai</TableHead>
                <TableHead className="text-center">Hari</TableHead>
                <TableHead>Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tripRows.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.shipName}</TableCell>
                  <TableCell className="max-w-40 truncate text-sm text-muted-foreground">{v.rute}</TableCell>
                  <TableCell className="text-sm">{v.tglStart ? formatDate(v.tglStart) : "-"}</TableCell>
                  <TableCell className="text-sm">{v.tglEnd ? formatDate(v.tglEnd) : "-"}</TableCell>
                  <TableCell className="text-center text-sm">{v.jumlahHari ?? "-"}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => loadActivities(v.id)} disabled={loading}>
                      {loading ? <Loader2 className="size-4 animate-spin" /> : "Aktivitas"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination page={tripSafe} totalPages={tripPages} pageParam="tripPage" />
        </CardContent>
      </Card>

      {activities && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setActivities(null)}>
          <div className="max-h-[80vh] w-full max-w-lg overflow-auto rounded-xl border bg-background p-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">Detail Aktivitas</h3>
              <Button variant="ghost" size="icon" onClick={() => setActivities(null)}><X className="size-4"/></Button>
            </div>
            <div className="space-y-1.5">
              {activities.map((a) => (
                <div key={a.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted/60">
                  <span className={cn("size-2 shrink-0 rounded-full", statusColor(a.status))} />
                  <span className="min-w-0 flex-1 font-medium">{a.aktivitas}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatDate(a.tanggal)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
