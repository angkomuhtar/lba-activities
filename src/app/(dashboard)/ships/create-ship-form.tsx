"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { createShip, type ActionResult } from "@/app/actions/ships";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateShipForm() {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    createShip,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4 rounded-xl border bg-background p-4">
      <div>
        <h2 className="font-semibold">Tambah Kapal</h2>
        <p className="text-sm text-muted-foreground">
          Daftarkan kapal baru untuk dimonitor.
        </p>
      </div>

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
        <Label htmlFor="nama">Nama kapal</Label>
        <Input id="nama" name="nama" placeholder="MV. Contoh Jaya" required autoComplete="off" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="muatan">Muatan</Label>
        <Input id="muatan" name="muatan" placeholder="Contoh: Batubara 3.000 MT" autoComplete="off" />
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Tambah Kapal
      </Button>
    </form>
  );
}