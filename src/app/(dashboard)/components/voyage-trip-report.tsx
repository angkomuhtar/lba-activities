"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { formatDate, formatNumber } from "@/lib/format";
import { paginate, usePage } from "@/lib/use-pagination";
import { cn } from "@/lib/utils";
import type { VoyageTrip } from "@/lib/voyages";
import { getTripActivities } from "@/app/actions/ships";
import { statusColor } from "@/lib/ship-status";

export interface TripJetty {
  id: string;
  nama: string;
  location: string | null;
  type: "LOADING" | "DISCHARGING" | null;
}

export function VoyageTripReport({ trips, jetties }: { trips: VoyageTrip[]; jetties: TripJetty[] }) {
  const tripPage = usePage("tripPage");
  const [jettyMuat, setJettyMuat] = useState("");
  const [jettyBongkar, setJettyBongkar] = useState("");
  const loadingJetties = jetties.filter((j) => j.type === "LOADING");
  const dischargingJetties = jetties.filter((j) => j.type === "DISCHARGING");
  const filteredTrips = trips.filter(
    (t) =>
      (!jettyMuat || t.ruteAsalId === jettyMuat) &&
      (!jettyBongkar || t.ruteTujuanId === jettyBongkar),
  );
  const { rows: tripRows, page: tripSafe, totalPages: tripPages } = paginate(filteredTrips, tripPage, 10);
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
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <CardTitle>Riwayat Perjalanan Terakhir</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              Jetty Muat
              <select
                value={jettyMuat}
                onChange={(e) => setJettyMuat(e.target.value)}
                className="h-9 min-w-40 rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="">Semua</option>
                {loadingJetties.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.location ? `${j.nama} (${j.location})` : j.nama}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              Jetty Bongkar
              <select
                value={jettyBongkar}
                onChange={(e) => setJettyBongkar(e.target.value)}
                className="h-9 min-w-40 rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="">Semua</option>
                {dischargingJetties.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.location ? `${j.nama} (${j.location})` : j.nama}
                  </option>
                ))}
              </select>
            </label>
          </div>
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
                <TableHead className="text-right">Total Fuel (L)</TableHead>
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
                  <TableCell className="text-right text-sm">{v.totalFuel === null ? "-" : formatNumber(v.totalFuel)}</TableCell>
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
