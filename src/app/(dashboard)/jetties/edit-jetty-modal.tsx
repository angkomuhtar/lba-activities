"use client";

import { useActionState, useState } from "react";
import { Loader2, Pencil, X } from "lucide-react";
import { updateJetty, type ActionResult } from "@/app/actions/jetties";
import type { JettyType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type JettyRow = {
  id: string;
  nama: string;
  alias: string | null;
  location: string | null;
  lat: number | null;
  lon: number | null;
  type: JettyType | null;
};

export function EditJettyModal({ jetty }: { jetty: JettyRow }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    (prev, fd) => updateJetty(jetty.id, prev, fd),
    undefined,
  );
  if (state?.success && open) {
    setTimeout(() => setOpen(false), 0);
  }

  return (
    <>
      <Button type="button" variant="ghost" size="icon-sm" title="Edit jetty" onClick={() => setOpen(true)}>
        <Pencil className="size-4" />
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div
            className="max-h-[80vh] w-full max-w-lg overflow-auto rounded-xl border bg-background p-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Edit Jetty</h3>
                <p className="text-sm text-muted-foreground">{jetty.nama}</p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)} title="Tutup">
                <X className="size-4" />
              </Button>
            </div>

            <form action={formAction} className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor={`nama-${jetty.id}`}>Nama</Label>
                <Input id={`nama-${jetty.id}`} name="nama" defaultValue={jetty.nama} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`alias-${jetty.id}`}>Alias</Label>
                <Input id={`alias-${jetty.id}`} name="alias" defaultValue={jetty.alias ?? ""} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor={`location-${jetty.id}`}>Lokasi</Label>
                <Input id={`location-${jetty.id}`} name="location" defaultValue={jetty.location ?? ""} />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`type-${jetty.id}`}>Tipe</Label>
                <select
                  id={`type-${jetty.id}`}
                  name="type"
                  defaultValue={jetty.type ?? ""}
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="">-</option>
                  <option value="LOADING">Loading</option>
                  <option value="DISCHARGING">Discharging</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:col-span-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor={`lat-${jetty.id}`}>Lat</Label>
                  <Input
                    id={`lat-${jetty.id}`}
                    name="lat"
                    defaultValue={jetty.lat?.toString() ?? ""}
                    inputMode="decimal"
                    step="any"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`lon-${jetty.id}`}>Long</Label>
                  <Input
                    id={`lon-${jetty.id}`}
                    name="lon"
                    defaultValue={jetty.lon?.toString() ?? ""}
                    inputMode="decimal"
                    step="any"
                  />
                </div>
              </div>
              {state?.error && <p className="w-full text-xs text-destructive sm:col-span-2">{state.error}</p>}
              <div className="flex justify-end gap-2 sm:col-span-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)} disabled={pending}>
                  Batal
                </Button>
                <Button type="submit" size="sm" disabled={pending}>
                  {pending && <Loader2 className="size-3 animate-spin" />} Simpan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}