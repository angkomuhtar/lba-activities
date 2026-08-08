import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, PenLine, Fuel as FuelIcon, Ship as ShipIcon } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/role-permissions";
import { PERMS } from "@/lib/perm-ids";
import { getShipDetail, statusColor, statusText } from "@/lib/ships";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Voyages, type VoyageItem } from "./voyages";
import { ActivityList } from "./activity-list";
import { StockList } from "./stock-list";

export const dynamic = "force-dynamic";

export default async function ShipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect("/login");
  if (!(await can(sessionUser.role, PERMS.shipView))) redirect("/");

  const ship = await getShipDetail(id);
  if (!ship) redirect("/ships");

  const canManage = await can(sessionUser.role, PERMS.shipManage);
  const canManageActivity = await can(sessionUser.role, PERMS.activityManage);
  const canManageStock = await can(sessionUser.role, PERMS.stockManage);
  const latest = ship.activities[0] ?? null;

  const voyages: VoyageItem[] = ship.voyages.map((v) => ({
    id: v.id,
    ruteAsal: v.ruteAsal,
    ruteTujuan: v.ruteTujuan,
    tglStart: v.tglStart ? toInputDate(v.tglStart) : null,
    tglEnd: v.tglEnd ? toInputDate(v.tglEnd) : null,
    siNomor: v.siNomor,
    siTanggal: v.siTanggal ? toInputDate(v.siTanggal) : null,
    spalNomor: v.spalNomor,
    spalTanggal: v.spalTanggal ? toInputDate(v.spalTanggal) : null,
    catatan: v.catatan,
    activities: v.activities.map((a) => ({
      id: a.id,
      aktivitas: a.aktivitas,
      status: a.status,
      tanggal: toInputDate(a.tanggal),
      catatan: a.catatan,
    })),
  }));

  const voyageLabels = new Map(
    ship.voyages.map((v) => [
      v.id,
      v.ruteAsal || v.ruteTujuan ? `${v.ruteAsal || "?"} → ${v.ruteTujuan || "?"}` : v.siNomor ? `SI ${v.siNomor}` : "Pelayaran",
    ]),
  );

  const activitiesWithVoyage = ship.activities.map((a) => ({
    ...a,
    voyageLabel: a.voyageId ? (voyageLabels.get(a.voyageId) ?? "Pelayaran") : "Tanpa Pelayaran",
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/ships"
            className="flex size-8 items-center justify-center rounded-lg border bg-background text-muted-foreground hover:bg-accent"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <span className="flex size-10 items-center justify-center rounded-lg bg-muted">
            <ShipIcon className="size-5 text-muted-foreground" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">{ship.nama}</h1>
              <Badge variant="outline" className="gap-1.5">
                <span className={cn("size-2 rounded-full", statusColor(latest?.status ?? null))} />
                {statusText(latest?.status ?? null)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {ship.muatan || "Muatan tidak diisi"}
              {latest ? ` · ${latest.aktivitas} (${formatDate(latest.tanggal)})` : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Data Pelayaran</CardTitle>
          </CardHeader>
          <CardContent>
            <Voyages shipId={ship.id} voyages={voyages} canManage={canManage} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <CardTitle>Aktivitas Harian</CardTitle>
            {canManageActivity && (
              <Link
                href="/activities"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
              >
                <PenLine className="size-4" />
                Input Aktivitas
              </Link>
            )}
          </CardHeader>
          <CardContent>
            <ActivityList activities={activitiesWithVoyage} canManage={canManageActivity} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <CardTitle>Fuel Harian (ME / AE)</CardTitle>
            <p className="text-sm text-muted-foreground">
              Stok awal otomatis diambil dari sisa kemarin. Sisa = stok awal − ME − AE.
            </p>
          </div>
          {canManageStock && (
            <Link
              href="/stocks"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
            >
              <FuelIcon className="size-4" />
              Input Fuel
            </Link>
          )}
        </CardHeader>
        <CardContent>
          <StockList stocks={ship.stocks} canManage={canManageStock} />
        </CardContent>
      </Card>
    </div>
  );
}

function toInputDate(value: Date): string {
  const d = new Date(value);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}