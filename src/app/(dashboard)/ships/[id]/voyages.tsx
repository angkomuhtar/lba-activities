"use client";

import { useActionState, useTransition, useState } from "react";
import { Check, FileCheck2, FileX2, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  createVoyage,
  deleteVoyage,
  finishVoyage,
  updateVoyage,
  type ActionResult,
} from "@/app/actions/ships";
import type { ActivityStatus, PaymentStatus } from "@prisma/client";
import { statusColor } from "@/lib/ship-status";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface VoyageActivity {
  id: string;
  aktivitas: string;
  status: ActivityStatus;
  tanggal: string;
  catatan: string | null;
}

export interface VoyageItem {
  id: string;
  ruteAsal: string | null;
  ruteTujuan: string | null;
  shipper: string | null;
  statusBayar: PaymentStatus | null;
  tglStart: string | null;
  tglEnd: string | null;
  siNomor: string | null;
  siTanggal: string | null;
  spalNomor: string | null;
  spalTanggal: string | null;
  catatan: string | null;
  activities: VoyageActivity[];
}

interface VoyagesProps {
  shipId: string;
  canManage: boolean;
  voyages: VoyageItem[];
}

export function Voyages({ shipId, canManage, voyages }: VoyagesProps) {
  return (
    <div className="space-y-4">
      {canManage && <AddVoyageForm shipId={shipId} />}

      {voyages.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Belum ada pelayaran. Tambahkan pelayaran untuk mulai mencatat aktivitas per voyage.
        </p>
      ) : (
        <div className="space-y-3">
          {voyages.map((v) => (
            <VoyageCard key={v.id} voyage={v} canManage={canManage} />
          ))}
        </div>
      )}
    </div>
  );
}

function voyageLabel(v: VoyageItem): string {
  if (v.ruteAsal || v.ruteTujuan) return `${v.ruteAsal || "?"} → ${v.ruteTujuan || "?"}`;
  if (v.siNomor) return `SI ${v.siNomor}`;
  return "Pelayaran";
}

function longestActivity(
  acts: VoyageActivity[],
): { aktivitas: string; status: ActivityStatus; days: number } | null {
  if (acts.length === 0) return null;
  const sorted = [...acts].sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  let best: { aktivitas: string; status: ActivityStatus; days: number } | null = null;
  let run: VoyageActivity[] = [];

  const flush = () => {
    if (run.length > 0) {
      if (!best || run.length > best.days) {
        best = { aktivitas: run[0].aktivitas, status: run[0].status, days: run.length };
      }
      run = [];
    }
  };

  for (const act of sorted) {
    if (run.length > 0 && run[0].aktivitas !== act.aktivitas) flush();
    run.push(act);
  }
  flush();
  return best;
}

type VoyageField =
  | "ruteAsal"
  | "ruteTujuan"
  | "shipper"
  | "tglStart"
  | "tglEnd"
  | "siNomor"
  | "siTanggal"
  | "spalNomor"
  | "spalTanggal";

const FIELDS: { name: VoyageField; label: string; type?: string }[] = [
  { name: "ruteAsal", label: "Rute Asal" },
  { name: "ruteTujuan", label: "Rute Tujuan" },
  { name: "shipper", label: "Shipper" },
  { name: "tglStart", label: "Tanggal Mulai", type: "date" },
  { name: "tglEnd", label: "Tanggal Selesai", type: "date" },
  { name: "siNomor", label: "No. SI" },
  { name: "siTanggal", label: "Tanggal SI", type: "date" },
  { name: "spalNomor", label: "No. SPAL" },
  { name: "spalTanggal", label: "Tanggal SPAL", type: "date" },
];

function VoyageFields({ disabled }: { disabled: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {FIELDS.map((f) => (
        <div key={f.name} className="space-y-2">
          <Label htmlFor={f.name}>{f.label}</Label>
          <Input id={f.name} name={f.name} type={f.type ?? "text"} disabled={disabled} />
        </div>
      ))}
    </div>
  );
}

function StatusBayarField({
  id,
  defaultValue,
  disabled,
}: {
  id: string;
  defaultValue?: string | null;
  disabled: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Status Pembayaran</Label>
      <select
        id={id}
        name="statusBayar"
        defaultValue={defaultValue ?? ""}
        disabled={disabled}
        className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
      >
        <option value="">Belum Ada</option>
        <option value="DP">DP</option>
        <option value="LUNAS">Lunas</option>
      </select>
    </div>
  );
}

function AddVoyageForm({ shipId }: { shipId: string }) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    (prev, formData) => createVoyage(shipId, prev, formData),
    undefined,
  );

  return (
    <form action={formAction} className="space-y-3 rounded-xl border bg-background p-4">
      <div className="flex items-center gap-2">
        <Plus className="size-4" />
        <h3 className="font-semibold">Tambah Pelayaran</h3>
      </div>

      {state?.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}
      {state?.success && (
        <p className="rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600">{state.success}</p>
      )}

      <VoyageFields disabled={pending} />
      <StatusBayarField id="statusBayar" disabled={pending} />
      <div className="space-y-2">
        <Label htmlFor="catatan">Catatan</Label>
        <Input id="catatan" name="catatan" disabled={pending} />
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending && <Loader2 className="size-4 animate-spin" />}
        Simpan Pelayaran
      </Button>
    </form>
  );
}

function VoyageCard({ voyage, canManage }: { voyage: VoyageItem; canManage: boolean }) {
  const [editing, setEditing] = useState(false);

  if (editing && canManage) {
    return <EditVoyageForm voyage={voyage} onCancel={() => setEditing(false)} />;
  }

  const longest = longestActivity(voyage.activities);
  const siAda = Boolean(voyage.siNomor && voyage.siTanggal);
  const spalAda = Boolean(voyage.spalNomor && voyage.spalTanggal);

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold">{voyageLabel(voyage)}</p>
          <p className="text-sm text-muted-foreground">
            {formatDate(voyage.tglStart)} — {voyage.tglEnd ? formatDate(voyage.tglEnd) : "masih berjalan"}
          </p>
        </div>
        {canManage && (
          <div className="flex shrink-0 gap-1">
            {!voyage.tglEnd && <FinishVoyageButton id={voyage.id} />}
            <Button type="button" variant="ghost" size="icon-sm" title="Edit" onClick={() => setEditing(true)}>
              <Pencil className="size-4" />
            </Button>
            <DeleteVoyageButton id={voyage.id} />
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        {voyage.statusBayar && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium",
              voyage.statusBayar === "DP"
                ? "bg-amber-400/15 text-amber-600"
                : "bg-emerald-500/15 text-emerald-600",
            )}
          >
            {voyage.statusBayar === "DP" ? "Down Payment" : "Lunas"}
          </span>
        )}
        {siAda ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 font-medium text-emerald-600">
            <FileCheck2 className="size-3.5" /> SI
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 font-medium text-red-600">
            <FileX2 className="size-3.5" /> SI
          </span>
        )}
        {spalAda ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 font-medium text-emerald-600">
            <FileCheck2 className="size-3.5" /> SPAL
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 font-medium text-red-600">
            <FileX2 className="size-3.5" /> SPAL
          </span>
        )}
        {voyage.ruteAsal && <span className="text-muted-foreground">SI: {voyage.siNomor || "-"} · SPAL: {voyage.spalNomor || "-"}</span>}
      </div>

      {voyage.shipper && (
        <p className="mt-2 text-sm text-muted-foreground">
          <span className="text-muted-foreground">Shipper:</span>{" "}
          <span className="font-medium">{voyage.shipper}</span>
        </p>
      )}

      {longest && (
        <p className="mt-3 flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm">
          <span className="text-muted-foreground">Aktivitas terlama:</span>
          <span className={cn("size-2 rounded-full", statusColor(longest.status))} />
          <span className="font-medium">{longest.aktivitas}</span>
          <span className="text-muted-foreground">({longest.days} hari)</span>
        </p>
      )}

      {voyage.activities.length > 0 && (
        <div className="mt-3 space-y-1.5 border-t pt-3">
          {voyage.activities.slice(0, 5).map((act) => (
            <div key={act.id} className="flex items-center gap-2 text-sm">
              <span className={cn("size-2 rounded-full", statusColor(act.status))} />
              <span className="flex-1 truncate">{act.aktivitas}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{formatDate(act.tanggal)}</span>
            </div>
          ))}
          {voyage.activities.length > 5 && (
            <p className="text-xs text-muted-foreground">
              +{voyage.activities.length - 5} aktivitas lainnya
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function EditVoyageForm({ voyage, onCancel }: { voyage: VoyageItem; onCancel: () => void }) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    (prev, formData) => updateVoyage(voyage.id, prev, formData),
    undefined,
  );

  return (
    <form action={formAction} className="space-y-3 rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Edit Pelayaran</h3>
        <Button type="button" variant="ghost" size="icon-sm" title="Batal" onClick={onCancel} disabled={pending}>
          <X className="size-4" />
        </Button>
      </div>

      {state?.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}
      {state?.success && (
        <p className="rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600">{state.success}</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {FIELDS.map((f) => (
          <div key={f.name} className="space-y-2">
            <Label htmlFor={`${f.name}-${voyage.id}`}>{f.label}</Label>
            <Input
              id={`${f.name}-${voyage.id}`}
              name={f.name}
              type={f.type ?? "text"}
              defaultValue={voyage[f.name] ?? ""}
              disabled={pending}
            />
          </div>
        ))}
      </div>
      <StatusBayarField id={`statusBayar-${voyage.id}`} defaultValue={voyage.statusBayar} disabled={pending} />
      <div className="space-y-2">
        <Label htmlFor={`catatan-${voyage.id}`}>Catatan</Label>
        <Input id={`catatan-${voyage.id}`} name="catatan" defaultValue={voyage.catatan ?? ""} disabled={pending} />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          Simpan
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
          Batal
        </Button>
      </div>
    </form>
  );
}

function FinishVoyageButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      title="Selesaikan pelayaran hari ini"
      disabled={pending}
      onClick={() => {
        if (!confirm("Selesaikan pelayaran ini hari ini?")) return;
        startTransition(async () => {
          await finishVoyage(id);
        });
      }}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
      Selesaikan
    </Button>
  );
}

function DeleteVoyageButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      title="Hapus pelayaran"
      disabled={pending}
      onClick={() => {
        if (!confirm("Hapus pelayaran ini? Aktivitasnya akan tetap ada tapi tidak terikat ke pelayaran.")) return;
        startTransition(async () => {
          await deleteVoyage(id);
        });
      }}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
    </Button>
  );
}