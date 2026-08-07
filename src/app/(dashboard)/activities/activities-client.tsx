"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ShipActivity } from "@prisma/client";
import { Loader2, Trash2 } from "lucide-react";
import { createActivity, deleteActivity, type ActionResult } from "@/app/actions/ships";
import { statusColor } from "@/lib/ship-status";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface ActivitiesClientProps {
  ships: { id: string; nama: string }[];
  categories: string[];
  activities: (ShipActivity & {
    ship: { nama: string };
    voyageLabel: string | null;
  })[];
  voyageCounts: Record<string, number>;
  canManage: boolean;
  selectedShipId: string;
}

export function ActivitiesClient({
  ships,
  categories,
  activities,
  voyageCounts,
  canManage,
  selectedShipId,
}: ActivitiesClientProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    (prev, formData) => createActivity(selectedShipId || ships[0]?.id || "", prev, formData),
    undefined,
  );
  const [navPending, startNav] = useTransition();

  const hasVoyage =
    (selectedShipId || ships[0]?.id || "") !== "" &&
    (voyageCounts[selectedShipId || ships[0]?.id || ""] ?? 0) > 0;

  const setFilter = (id: string) => {
    startNav(() => {
      router.push(id ? `/activities?ship=${id}` : "/activities");
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Input Aktivitas Kapal</h1>
        <p className="text-sm text-muted-foreground">
          Catat aktivitas harian kapal. Status warna otomatis dari jenis aktivitas.
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
                value={selectedShipId || ""}
                onChange={(e) => setFilter(e.target.value)}
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

            {selectedShipId && !hasVoyage && (
              <p className="rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-600">
                Belum ada pelayaran untuk kapal ini. Tambahkan pelayaran dahulu di halaman kapal (Data
                Pelayaran) sebelum input aktivitas.
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="tanggal">Tanggal</Label>
              <Input id="tanggal" name="tanggal" type="date" required disabled={!canManage} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aktivitas">Aktivitas</Label>
              <select
                id="aktivitas"
                name="aktivitas"
                required
                disabled={!canManage}
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="">Pilih aktivitas...</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="catatan">Catatan (opsional)</Label>
              <Input id="catatan" name="catatan" placeholder="Contoh: mulai sandar jetty" disabled={!canManage} />
            </div>

            {canManage ? (
              <Button
                type="submit"
                className="w-full"
                disabled={pending || !selectedShipId || !hasVoyage}
              >
                {pending && <Loader2 className="size-4 animate-spin" />}
                Simpan Aktivitas
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Anda tidak memiliki izin untuk input aktivitas.
              </p>
            )}
          </form>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-xl border bg-background">
            <div className="border-b px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold">Riwayat Aktivitas</h2>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setFilter("")}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs transition-colors",
                      !selectedShipId
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
                      onClick={() => setFilter(s.id)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs transition-colors",
                        selectedShipId === s.id
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

            <div className="relative">
              {navPending && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
              )}
              <div className={cn("divide-y", navPending && "opacity-50")}>
                {activities.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Belum ada aktivitas tercatat.
                </p>
              ) : (
                activities.map((act) => (
                  <div key={act.id} className="flex items-start gap-3 px-4 py-3">
                    <span className={cn("mt-1 size-2.5 shrink-0 rounded-full", statusColor(act.status))} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{act.aktivitas}</p>
                        <Badge variant="outline" className="text-xs">
                          {act.ship.nama}
                        </Badge>
                        {act.voyageLabel && (
                          <Badge variant="secondary" className="max-w-40 truncate text-xs">
                            {act.voyageLabel}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">{formatDate(act.tanggal)}</span>
                      </div>
                      {act.catatan && (
                        <p className="mt-0.5 text-sm text-muted-foreground">{act.catatan}</p>
                      )}
                    </div>
                    {canManage && (
                      <DeleteActivityButton id={act.id} />
                    )}
                  </div>
                ))
              )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeleteActivityButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      title="Hapus aktivitas"
      disabled={pending}
      onClick={() => {
        if (!confirm("Hapus aktivitas ini?")) return;
        startTransition(async () => {
          await deleteActivity(id);
        });
      }}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
    </Button>
  );
}