"use client";

import { useActionState, useState } from "react";
import { Check, Loader2, Pencil, X } from "lucide-react";
import { updateShip, type ActionResult } from "@/app/actions/ships";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EditShipInline({ ship }: { ship: { id: string; nama: string; muatan: string | null; mmsi: string | null } }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    (prev, fd) => updateShip(ship.id, prev, fd),
    undefined,
  );
  if (state?.success && open) {
    setTimeout(() => setOpen(false), 0);
  }
  if (!open) {
    return (
      <Button type="button" variant="ghost" size="icon-sm" title="Edit kapal" onClick={() => setOpen(true)}>
        <Pencil className="size-4" />
      </Button>
    );
  }
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2 rounded-lg border bg-muted/20 p-2">
      <div className="min-w-28 flex-1 space-y-1">
        <Label htmlFor={`nama-${ship.id}`}>Nama</Label>
        <Input id={`nama-${ship.id}`} name="nama" defaultValue={ship.nama} required />
      </div>
      <div className="min-w-24 flex-1 space-y-1">
        <Label htmlFor={`muatan-${ship.id}`}>Muatan</Label>
        <Input id={`muatan-${ship.id}`} name="muatan" defaultValue={ship.muatan ?? ""} />
      </div>
      <div className="w-36 space-y-1">
        <Label htmlFor={`mmsi-${ship.id}`}>MMSI</Label>
        <Input id={`mmsi-${ship.id}`} name="mmsi" defaultValue={ship.mmsi ?? ""} inputMode="numeric" pattern="\d{9}" maxLength={9} placeholder="525000123" />
      </div>
      {state?.error && <p className="w-full text-xs text-destructive">{state.error}</p>}
      <div className="flex gap-1">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />} Simpan
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)} disabled={pending}>
          <X className="size-3" /> Batal
        </Button>
      </div>
    </form>
  );
}
