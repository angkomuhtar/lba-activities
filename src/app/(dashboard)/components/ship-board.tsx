"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  CalendarClock,
  FileCheck2,
  FileX2,
  Fuel as FuelIcon,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Rocket,
  Search,
  Ship,
  Trash2,
  X,
} from "lucide-react";
import type { ShipWithStatus } from "@/lib/ship-status";
import { statusColor, statusText } from "@/lib/ship-status";
import { formatDate, formatNumber } from "@/lib/format";
import { paginate, usePage } from "@/lib/use-pagination";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  upsertVoyagePlan,
  deleteVoyagePlan,
  realizeVoyagePlan,
  type ActionResult,
} from "@/app/actions/ships";

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
    const statusOrder: Record<string, number> = {
      merah: 0,
      kuning: 1,
      hijau: 2,
      "-": 3,
    };
    return data
      .filter(({ ship, latest }) => {
        if (filter !== "semua" && latest?.status !== filter) return false;
        if (query && !ship.nama.toLowerCase().includes(query.toLowerCase()))
          return false;
        return true;
      })
      .sort(
        (a, b) =>
          (statusOrder[a.latest?.status ?? "-"] ?? 3) -
          (statusOrder[b.latest?.status ?? "-"] ?? 3),
      );
  }, [data, query, filter]);

  return (
    <div className='space-y-4'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='relative w-full sm:max-w-xs'>
          <Search className='absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Cari nama kapal...'
            className='pl-9'
          />
        </div>

        <div className='flex flex-wrap gap-2'>
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type='button'
              onClick={() => setFilter(key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors",
                filter === key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-accent",
              )}>
              {key !== "semua" && (
                <span
                  className={cn(
                    "size-2 rounded-full",
                    statusColor(key as "hijau" | "kuning" | "merah"),
                  )}
                />
              )}
              {label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className='rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground'>
          Tidak ada kapal yang cocok.
        </div>
      ) : (
        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
          {filtered.map((card) => (
            <ShipCard key={card.ship.id} card={card} />
          ))}
        </div>
      )}
    </div>
  );
}

function ShipCard({ card }: { card: ShipWithStatus }) {
  const {
    ship,
    latest,
    fuelSisa,
    siAda,
    spalAda,
    stocks,
    ruteAsal,
    ruteTujuan,
    shipper,
    statusBayar,
    invoiceNomor,
    loadingStart,
    loadingFinish,
    bongkarStart,
    bongkarFinish,
    activities,
    nextPlan,
  } = card;
  const [fuelOpen, setFuelOpen] = useState(false);
  const [activitiesOpen, setActivitiesOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);

  const ruteLabel =
    ruteAsal || ruteTujuan ? `${ruteAsal || "?"} → ${ruteTujuan || "?"}` : null;

  const hasStatus =
    latest?.status === "hijau" ||
    latest?.status === "kuning" ||
    latest?.status === "merah";

  const headerBg = cn(
    latest?.status === "hijau" && "bg-emerald-500",
    latest?.status === "kuning" && "bg-amber-400",
    latest?.status === "merah" && "bg-red-500",
    !hasStatus && "bg-card",
  );

  const headerText = hasStatus ? "text-black" : "text-foreground";
  const headerSub = hasStatus ? "text-black/70" : "text-muted-foreground";
  const iconBg = hasStatus ? "bg-white/30" : "bg-muted";
  const iconColor = hasStatus ? "text-black" : "text-muted-foreground";

  return (
    <div className='group relative flex flex-col overflow-hidden rounded-xl border bg-card p-4 transition-shadow hover:shadow-md'>
      <span
        className={cn(
          "absolute inset-y-0 left-0 w-1.5",
          statusColor(latest?.status ?? null),
        )}
      />

      <div
        className={cn(
          "flex items-start justify-between gap-3 rounded-lg px-3 py-2 pl-2",
          headerBg,
        )}>
        <Link
          href={`/ships/${ship.id}`}
          className='flex min-w-0 items-center gap-3'>
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-lg",
              iconBg,
            )}>
            <Ship className={cn("size-5", iconColor)} />
          </span>
          <div className='min-w-0'>
            <p
              className={cn(
                "truncate font-semibold leading-tight group-hover:underline",
                headerText,
              )}>
              {ship.nama}
            </p>
            <p className={cn("truncate text-sm", headerSub)}>
              {ship.muatan || "Muatan tidak diisi"}
            </p>
          </div>
        </Link>
        <Badge
          className={cn(
            hasStatus
              ? "bg-white/30 text-black"
              : "bg-muted text-muted-foreground",
          )}>
          {statusText(latest?.status ?? null)}
        </Badge>
      </div>

      <div className='mt-3 space-y-2 border-t pt-3 pl-1'>
        <button
          type='button'
          onClick={() => setFuelOpen(true)}
          className='flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-left transition-colors hover:bg-muted'>
          <span className='flex items-center gap-2 text-sm text-muted-foreground'>
            <FuelIcon className='size-4' />
            Sisa Stok
          </span>
          <span className='flex items-center gap-2 text-sm font-semibold'>
            {fuelSisa !== null ? `${formatNumber(fuelSisa)} L` : "Tidak ada"}
            {stocks.length > 0 && (
              <span className='text-xs font-normal text-muted-foreground'>
                · lihat
              </span>
            )}
          </span>
        </button>

        <div className='flex items-center gap-2 text-sm'>
          <span className='text-muted-foreground'>Dokumen:</span>
          {siAda ? (
            <span className='inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-600'>
              <FileCheck2 className='size-3.5' /> SI
            </span>
          ) : (
            <span className='inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-600'>
              <FileX2 className='size-3.5' /> SI
            </span>
          )}
          {spalAda ? (
            <span className='inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-600'>
              <FileCheck2 className='size-3.5' /> SPAL
            </span>
          ) : (
            <span className='inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-600'>
              <FileX2 className='size-3.5' /> SPAL
            </span>
          )}
        </div>

        {ruteLabel && (
          <div className='flex items-center gap-2 text-sm'>
            <span className='text-muted-foreground'>Rute:</span>
            <span className='truncate font-medium'>{ruteLabel}</span>
          </div>
        )}

        <div className='flex items-center gap-2 text-sm'>
          <span className='text-muted-foreground'>Status Pembayaran:</span>
          {statusBayar ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                statusBayar === "DP"
                  ? "bg-amber-400/15 text-amber-600"
                  : "bg-emerald-500/15 text-emerald-600",
              )}>
              {statusBayar === "DP" ? "Down Payment" : "Lunas"}
            </span>
          ) : (
            <span className='truncate font-medium'>Belum Ada</span>
          )}
        </div>

        {invoiceNomor && (
          <div className='flex items-center gap-2 text-sm'>
            <span className='text-muted-foreground'>No. Invoice:</span>
            <span className='truncate font-medium'>{invoiceNomor}</span>
          </div>
        )}

        <div className='flex items-center gap-2 text-sm'>
          <span className='text-muted-foreground'>Shipper:</span>
          <span className='truncate font-medium'>{shipper ?? "?"}</span>
        </div>

        {ship.mmsi && (
          <div className='flex items-center gap-2 text-sm'>
            <span className='text-muted-foreground'>MMSI:</span>
            <span className='truncate font-mono font-medium'>{ship.mmsi}</span>
          </div>
        )}

        <div className='flex items-center gap-2 text-sm'>
          <span className='text-muted-foreground'>Start Loading:</span>
          <span className='truncate font-medium'>
            {loadingStart ? formatDate(loadingStart) : "?"}
          </span>
        </div>

        <div className='flex items-center gap-2 text-sm'>
          <span className='text-muted-foreground'>Finish Loading:</span>
          <span className='truncate font-medium'>
            {loadingFinish ? formatDate(loadingFinish) : "?"}
          </span>
        </div>
        <div className='flex items-center gap-2 text-sm'>
          <span className='text-muted-foreground'>Start Bongkar:</span>
          <span className='truncate font-medium'>
            {bongkarStart ? formatDate(bongkarStart) : "?"}
          </span>
        </div>
        <div className='flex items-center gap-2 text-sm'>
          <span className='text-muted-foreground'>Finish Bongkar:</span>
          <span className='truncate font-medium'>
            {bongkarFinish ? formatDate(bongkarFinish) : "?"}
          </span>
        </div>
      </div>

      <div className='mt-3 border-t pt-3 pl-1 text-sm text-muted-foreground'>
        <button
          type='button'
          onClick={() => setActivitiesOpen(true)}
          className='flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-left transition-colors hover:bg-muted'>
          <span className='flex items-center gap-2 text-sm text-muted-foreground'>
            {latest
              ? `${latest.aktivitas} — ${formatDate(latest.tanggal)}`
              : "Belum ada aktivitas"}
          </span>
          <span className='flex items-center gap-2 text-sm font-semibold'>
            {activities.length > 0
              ? `${activities.length} catatan`
              : "Tidak ada"}
            {activities.length > 0 && (
              <span className='text-xs font-normal text-muted-foreground'>
                · lihat
              </span>
            )}
          </span>
        </button>
      </div>

      <PlanSection plan={nextPlan} onEdit={() => setPlanOpen(true)} />

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

      {planOpen && (
        <PlanModal
          shipId={ship.id}
          plan={nextPlan}
          onClose={() => setPlanOpen(false)}
        />
      )}
    </div>
  );
}

function PlanSection({
  plan,
  onEdit,
}: {
  plan: ShipWithStatus["nextPlan"];
  onEdit: () => void;
}) {
  const [tPending, startTransition] = useTransition();
  const [confirmRealize, setConfirmRealize] = useState(false);

  const planRute =
    plan && (plan.ruteAsal || plan.ruteTujuan)
      ? `${plan.ruteAsal || "?"} → ${plan.ruteTujuan || "?"}`
      : null;

  if (!plan) {
    return (
      <div className='mt-3 space-y-2 border-t pt-3 pl-1'>
        <div className='flex items-center justify-between'>
          <span className='flex items-center gap-2 text-sm font-medium text-muted-foreground'>
            <CalendarClock className='size-4' />
            Pelayaran Selanjutnya
          </span>
        </div>
        <p className='text-sm text-muted-foreground'>Belum ada rencana.</p>
        <Button
          type='button'
          variant='outline'
          size='sm'
          className='gap-1.5'
          onClick={onEdit}>
          <Plus className='size-3.5' />
          Tambah Plan
        </Button>
      </div>
    );
  }

  return (
    <div className='mt-3 space-y-2 border-t pt-3 pl-1'>
      <div className='flex items-center justify-between'>
        <span className='flex items-center gap-2 text-sm font-medium text-muted-foreground'>
          <CalendarClock className='size-4' />
          Pelayaran Selanjutnya
        </span>
      </div>

      <div className='space-y-1'>
        <div className='flex items-center gap-2 text-sm'>
          <MapPin className='size-3.5 text-muted-foreground' />
          <span className='text-muted-foreground'>Rute:</span>
          <span className='truncate font-medium'>
            {planRute ?? "Belum diatur"}
          </span>
        </div>
        <div className='flex items-center gap-2 text-sm'>
          <CalendarClock className='size-3.5 text-muted-foreground' />
          <span className='text-muted-foreground'>ETA:</span>
          <span className='truncate font-medium'>
            {plan.eta ? formatDate(plan.eta) : "Belum diatur"}
          </span>
        </div>
      </div>

      {!confirmRealize ? (
        <div className='flex gap-2'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='gap-1.5'
            onClick={onEdit}>
            <Pencil className='size-3' />
            Edit
          </Button>
          <Button
            type='button'
            variant='default'
            size='sm'
            className='gap-1.5 bg-emerald-600 hover:bg-emerald-700'
            disabled={tPending}
            onClick={() => setConfirmRealize(true)}>
            <Rocket className='size-3' />
            Realisasi
          </Button>
        </div>
      ) : (
        <div className='rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-700 dark:bg-amber-950/30'>
          <p className='mb-2 text-sm font-medium text-amber-800 dark:text-amber-300'>
            Realisasikan plan ini menjadi pelayaran baru?
          </p>
          <div className='flex gap-2'>
            <Button
              type='button'
              variant='default'
              size='sm'
              className='gap-1.5 bg-emerald-600 hover:bg-emerald-700'
              disabled={tPending}
              onClick={() =>
                startTransition(async () => {
                  await realizeVoyagePlan(plan.id);
                  setConfirmRealize(false);
                })
              }>
              {tPending ? (
                <Loader2 className='size-3 animate-spin' />
              ) : (
                <Rocket className='size-3' />
              )}
              Ya, Realisasi
            </Button>
            <Button
              type='button'
              variant='outline'
              size='sm'
              disabled={tPending}
              onClick={() => setConfirmRealize(false)}>
              Batal
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function PlanModal({
  shipId,
  plan,
  onClose,
}: {
  shipId: string;
  plan: ShipWithStatus["nextPlan"];
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    upsertVoyagePlan.bind(null, shipId),
    undefined,
  );
  const [delPending, startDelTransition] = useTransition();

  // Konversi ISO date ke YYYY-MM-DD untuk input type=date
  const etaDefault = plan?.eta ? plan.eta.slice(0, 10) : "";

  // Tutup modal ketika berhasil simpan
  if (state?.success) {
    // Delay close agar revalidation selesai
    setTimeout(() => onClose(), 0);
  }

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'
      onClick={onClose}>
      <div
        className='w-full max-w-md rounded-xl border bg-background p-5 shadow-lg'
        onClick={(e) => e.stopPropagation()}>
        <div className='mb-4 flex items-center justify-between'>
          <h3 className='font-semibold'>
            {plan ? "Edit Rencana Pelayaran" : "Tambah Rencana Pelayaran"}
          </h3>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            onClick={onClose}
            title='Tutup'>
            <X className='size-4' />
          </Button>
        </div>

        <form action={formAction} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor={`planAsal-${shipId}`}>Rute Asal</Label>
            <Input
              id={`planAsal-${shipId}`}
              name='ruteAsal'
              placeholder='Contoh: Samarinda'
              defaultValue={plan?.ruteAsal ?? ""}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor={`planTujuan-${shipId}`}>Rute Tujuan</Label>
            <Input
              id={`planTujuan-${shipId}`}
              name='ruteTujuan'
              placeholder='Contoh: Surabaya'
              defaultValue={plan?.ruteTujuan ?? ""}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor={`planEta-${shipId}`}>ETA (Tanggal Mulai)</Label>
            <Input
              id={`planEta-${shipId}`}
              name='eta'
              type='date'
              defaultValue={etaDefault}
            />
          </div>

          {state?.error && (
            <p className='text-sm text-red-600'>{state.error}</p>
          )}

          <div className='flex items-center justify-between'>
            <div className='flex gap-2'>
              <Button type='submit' size='sm' disabled={pending}>
                {pending ? (
                  <Loader2 className='mr-1.5 size-3 animate-spin' />
                ) : null}
                Simpan
              </Button>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={onClose}
                disabled={pending}>
                Batal
              </Button>
            </div>

            {plan && (
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30'
                disabled={delPending}
                onClick={() =>
                  startDelTransition(async () => {
                    await deleteVoyagePlan(plan.id);
                    onClose();
                  })
                }>
                {delPending ? (
                  <Loader2 className='size-3 animate-spin' />
                ) : (
                  <Trash2 className='size-3' />
                )}
                Hapus Plan
              </Button>
            )}
          </div>
        </form>
      </div>
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
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'
      onClick={onClose}>
      <div
        className='max-h-[80vh] w-full max-w-lg overflow-auto rounded-xl border bg-background p-4 shadow-lg'
        onClick={(e) => e.stopPropagation()}>
        <div className='mb-3 flex items-center justify-between'>
          <div>
            <h3 className='font-semibold'>Aktivitas Harian — {shipName}</h3>
            <p className='text-sm text-muted-foreground'>
              Aktivitas pada pelayaran terakhir.
            </p>
          </div>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            onClick={onClose}
            title='Tutup'>
            <X className='size-4' />
          </Button>
        </div>

        {activities.length === 0 ? (
          <p className='py-8 text-center text-sm text-muted-foreground'>
            Belum ada aktivitas.
          </p>
        ) : (
          <div className='space-y-1.5'>
            {activities.slice(0, 50).map((act) => (
              <div
                key={act.id}
                className='flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted/60'>
                <span
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    statusColor(act.status),
                  )}
                />
                <span className='min-w-0 flex-1'>
                  <span className='font-medium'>{act.aktivitas}</span>
                  {act.catatan && (
                    <span className='ml-2 truncate text-xs text-muted-foreground'>
                      {act.catatan}
                    </span>
                  )}
                </span>
                <span className='shrink-0 text-xs text-muted-foreground'>
                  {formatDate(act.tanggal)}
                </span>
              </div>
            ))}
            {activities.length > 50 && (
              <p className='pt-2 text-center text-xs text-muted-foreground'>
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
  const page = usePage("fuelPage");
  const { rows, page: safePage, totalPages } = paginate(stocks, page);

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'
      onClick={onClose}>
      <div
        className='max-h-[80vh] w-full max-w-lg overflow-auto rounded-xl border bg-background p-4 shadow-lg'
        onClick={(e) => e.stopPropagation()}>
        <div className='mb-3 flex items-center justify-between'>
          <div>
            <h3 className='font-semibold'>Fuel Harian — {shipName}</h3>
            <p className='text-sm text-muted-foreground'>
              Riwayat pemakaian fuel (ME / AE).
            </p>
          </div>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            onClick={onClose}
            title='Tutup'>
            <X className='size-4' />
          </Button>
        </div>

        {stocks.length === 0 ? (
          <p className='py-8 text-center text-sm text-muted-foreground'>
            Belum ada data fuel.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead className='text-right'>Awal</TableHead>
                <TableHead className='text-right'>Isi</TableHead>
                <TableHead className='text-right'>ME</TableHead>
                <TableHead className='text-right'>AE</TableHead>
                <TableHead className='text-right'>Sisa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((rec) => (
                <TableRow key={rec.id}>
                  <TableCell>{formatDate(rec.tanggal)}</TableCell>
                  <TableCell className='text-right'>
                    {formatNumber(rec.stokAwal)}
                  </TableCell>
                  <TableCell className='text-right'>
                    {formatNumber(rec.pengisian)}
                  </TableCell>
                  <TableCell className='text-right'>
                    {formatNumber(rec.me)}
                  </TableCell>
                  <TableCell className='text-right'>
                    {formatNumber(rec.ae)}
                  </TableCell>
                  <TableCell className='text-right font-medium'>
                    {formatNumber(rec.sisaStok)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {stocks.length > 0 && (
          <Pagination page={safePage} totalPages={totalPages} />
        )}
      </div>
    </div>
  );
}
