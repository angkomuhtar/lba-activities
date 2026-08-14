import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, CalendarClock, Circle, CircleDollarSign, Compass, FileText, Ship as ShipIcon } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/role-permissions";
import { PERMS } from "@/lib/perm-ids";
import { getShipsWithStatus } from "@/lib/ships";
import { getPersistedAlerts, getUnpaidVoyages, getVoyagesPerShipMonthly } from "@/lib/voyages";
import { getExpiringDocuments } from "@/lib/documents";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ShipBoard } from "./components/ship-board";
import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const MONTH_LABEL = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function shortMonth(key: string): string {
  const [, m] = key.split("-");
  const idx = Number(m) - 1;
  return MONTH_LABEL[idx] ?? m;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page = "1" } = await searchParams;
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!(await can(user.role, PERMS.shipView))) redirect("/login");

  const canViewDocuments = await can(user.role, PERMS.documentView);

  const [data, alerts, perShip, unpaid, expiringDocs] = await Promise.all([
    getShipsWithStatus(),
    getPersistedAlerts(2),
    getVoyagesPerShipMonthly(),
    getUnpaidVoyages(),
    canViewDocuments ? getExpiringDocuments(30) : Promise.resolve([]),
  ]);

  const count = (s: "hijau" | "kuning" | "merah" | null) =>
    data.filter(({ latest }) => (s === null ? latest === null : latest?.status === s)).length;

  const stats = [
    { label: "Total Kapal", value: data.length, icon: ShipIcon, className: "" },
    { label: "Hijau", value: count("hijau"), icon: Circle, className: "text-emerald-600" },
    { label: "Kuning", value: count("kuning"), icon: Circle, className: "text-amber-600" },
    { label: "Merah", value: count("merah"), icon: Circle, className: "text-red-600" },
    { label: "Perhatian", value: alerts.length, icon: AlertTriangle, className: "text-red-600" },
  ];

  // sumbu bulan: selalu tampilkan bulan ini dan bulan lalu (2 kolom terakhir).
  const now = new Date();
  const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const months = [monthKey(lastMonth), monthKey(now)];

  const PAGE_SIZE = 10;
  const perShipTotalPages = Math.max(1, Math.ceil(perShip.length / PAGE_SIZE));
  const parsed = Number(page);
  const pageNum = Number.isFinite(parsed) && parsed > 0 ? Math.min(Math.floor(parsed), perShipTotalPages) : 1;
  const perShipRows = perShip.slice((pageNum - 1) * PAGE_SIZE, pageNum * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Monitoring Status Kapal</h2>
        <p className="text-sm text-muted-foreground">
          Status warna diambil dari aktivitas terakhir tiap kapal.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <span className="flex size-9 items-center justify-center rounded-lg bg-muted">
                <stat.icon className={cn("size-4", stat.className)} />
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-red-600" />
              Perhatian — Merah
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Tidak ada kapal dengan aktivitas merah (2 hari, khusus Waiting Dokumen 3 hari).
              </p>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <Link
                    key={`${alert.shipId}-${alert.aktivitas}-${alert.from.toISOString()}`}
                    href={`/ships/${alert.shipId}`}
                    className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
                  >
                    <span className="mt-1 size-2.5 shrink-0 rounded-full bg-red-500" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {alert.shipName}
                        <span className="ml-2 text-muted-foreground">
                          {alert.aktivitas}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(alert.from)} — {formatDate(alert.to)} · {alert.days} hari
                      </p>
                    </div>
                    <BadgeAlert status={alert.status} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Compass className="size-4 text-muted-foreground" />
              Voyage per Bulan (per Kapal)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {perShip.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada kapal.</p>
            ) : months.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada data pelayaran.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kapal</TableHead>
                      {months.map((m) => (
                        <TableHead key={m} className="text-center">
                          {shortMonth(m)}
                        </TableHead>
                      ))}
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {perShipRows.map((s) => (
                      <TableRow key={s.shipId}>
                        <TableCell className="font-medium">{s.shipName}</TableCell>
                        {months.map((m) => (
                          <TableCell key={m} className="text-center">
                            {s.byMonth[m] ?? 0}
                          </TableCell>
                        ))}
                        <TableCell className="text-right font-medium">{s.total}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {perShip.length > 0 && <Pagination page={pageNum} totalPages={perShipTotalPages} />}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CircleDollarSign className="size-4 text-amber-600" />
              Pelayaran Belum Lunas ({unpaid.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {unpaid.length === 0 ? (
              <p className="text-sm text-muted-foreground">Semua pelayaran sudah lunas.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kapal</TableHead>
                      <TableHead>Rute</TableHead>
                      <TableHead>Status Bayar</TableHead>
                      <TableHead>Status Pelayaran</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unpaid.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell className="font-medium">{v.shipName}</TableCell>
                        <TableCell className="max-w-40 truncate text-sm text-muted-foreground">
                          {v.rute}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              "border-0",
                              v.statusBayar === "DP"
                                ? "bg-amber-400/15 text-amber-600"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            {v.statusBayar === "DP" ? "DP" : "Belum Ada"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              "border-0",
                              v.selesai
                                ? "bg-muted text-muted-foreground"
                                : "bg-sky-500/15 text-sky-600",
                            )}
                          >
                            {v.selesai ? "Selesai" : "Berjalan"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {canViewDocuments && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="size-4 text-amber-600" />
              Dokumen Akan Kedaluwarsa ({expiringDocs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expiringDocs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Tidak ada dokumen yang akan kedaluwarsa dalam 30 hari ke depan.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {expiringDocs.map((doc) => (
                  <Link
                    key={doc.id}
                    href="/documents"
                    className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
                        doc.expired ? "bg-red-500/15 text-red-600" : "bg-amber-400/15 text-amber-600",
                      )}
                    >
                      <FileText className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {doc.nama}
                        <span className="ml-2 text-muted-foreground">{doc.nomor}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {doc.expired
                          ? `Sudah kedaluwarsa ${Math.abs(doc.days)} hari lalu (${formatDate(doc.tglExpire)})`
                          : doc.days === 0
                            ? `Kedaluwarsa hari ini (${formatDate(doc.tglExpire)})`
                            : `Akan kedaluwarsa dalam ${doc.days} hari (${formatDate(doc.tglExpire)})`}
                      </p>
                    </div>
                    {doc.expired && <BadgeAlert status="merah" />}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <ShipBoard data={data} />
    </div>
  );
}

function BadgeAlert({ status }: { status: "kuning" | "merah" }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
        status === "kuning"
          ? "bg-amber-400/15 text-amber-600"
          : "bg-red-500/15 text-red-600",
      )}
    >
      {status === "kuning" ? "Kuning" : "Merah"}
    </span>
  );
}