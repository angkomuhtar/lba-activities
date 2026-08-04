import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, Circle, Compass, Ship as ShipIcon } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/role-permissions";
import { PERMS } from "@/lib/perm-ids";
import { getShipsWithStatus } from "@/lib/ships";
import { getPersistedAlerts, getVoyagesPerShipMonthly } from "@/lib/voyages";
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

export const dynamic = "force-dynamic";

const MONTH_LABEL = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function shortMonth(key: string): string {
  const [, m] = key.split("-");
  const idx = Number(m) - 1;
  return MONTH_LABEL[idx] ?? m;
}

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!(await can(user.role, PERMS.shipView))) redirect("/login");

  const [data, alerts, perShip] = await Promise.all([
    getShipsWithStatus(),
    getPersistedAlerts(2),
    getVoyagesPerShipMonthly(),
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

  // sumbu bulan: gabungan semua bulan yang muncul, ambil 6 terakhir (ter-sort).
  const allMonths = Array.from(
    new Set(perShip.flatMap((s) => Object.keys(s.byMonth))),
  ).sort();
  const months = allMonths.slice(-7);

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

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-red-600" />
              Perhatian — Kuning/Merah {">"} 2 Hari
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Tidak ada kapal dengan aktivitas kuning/merah yang bertahan {">"} 2 hari.
              </p>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <Link
                    key={`${alert.shipId}-${alert.aktivitas}-${alert.from.toISOString()}`}
                    href={`/ships/${alert.shipId}`}
                    className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
                  >
                    <span
                      className={cn(
                        "mt-1 size-2.5 shrink-0 rounded-full",
                        alert.status === "kuning" ? "bg-amber-400" : "bg-red-500",
                      )}
                    />
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
                    {perShip.map((s) => (
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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