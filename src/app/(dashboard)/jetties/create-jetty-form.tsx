"use client";

import { useActionState, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { createJetty, type ActionResult } from "@/app/actions/jetties";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

export function CreateJettyForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    createJetty,
    undefined,
  );
  if (state?.success && open) {
    setTimeout(() => setOpen(false), 0);
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger render={<Button variant="outline" />}>
        <Plus className="size-4" />
        Tambah Jetty
      </DrawerTrigger>
      <DrawerContent>
        <form action={formAction} className="flex min-h-0 flex-col">
          <DrawerHeader className="mt-4 text-left sm:text-left">
            <DrawerTitle>Tambah Jetty</DrawerTitle>
            <DrawerDescription>Daftarkan lokasi baru untuk loading/discharging.</DrawerDescription>
          </DrawerHeader>

          <div className="space-y-4 overflow-y-auto px-4 pb-4">
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
              <Label htmlFor="nama">Nama Jetty</Label>
              <Input id="nama" name="nama" placeholder="Contoh: Jetty GPS" required autoComplete="off" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alias">Alias</Label>
              <Input id="alias" name="alias" placeholder="Contoh: IMIP GPS" autoComplete="off" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Lokasi</Label>
              <Input id="location" name="location" placeholder="Contoh: Obi, Maluku Utara" autoComplete="off" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipe</Label>
              <select
                id="type"
                name="type"
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="">-</option>
                <option value="LOADING">Loading</option>
                <option value="DISCHARGING">Discharging</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="lat">Latitude</Label>
                <Input id="lat" name="lat" placeholder="-1.5697" inputMode="decimal" step="any" autoComplete="off" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lon">Longitude</Label>
                <Input id="lon" name="lon" placeholder="127.4092" inputMode="decimal" step="any" autoComplete="off" />
              </div>
            </div>
          </div>

          <DrawerFooter>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Tambah Jetty
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}