"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { createRole, type ActionResult } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateRoleForm() {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    createRole,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4 rounded-xl border bg-background p-4">
      <div>
        <h2 className="font-semibold">Tambah Role</h2>
        <p className="text-sm text-muted-foreground">
          Buat role baru untuk klasifikasi pengguna.
        </p>
      </div>

      {state?.success && (
        <p className="rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600">
          {state.success}
        </p>
      )}
      {state?.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="role-name">Nama (kode)</Label>
        <Input
          id="role-name"
          name="name"
          placeholder="sales, reviewer, ..."
          autoComplete="off"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role-label">Label</Label>
        <Input
          id="role-label"
          name="label"
          placeholder="Sales"
          autoComplete="off"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role-description">Deskripsi (opsional)</Label>
        <Input
          id="role-description"
          name="description"
          placeholder="Deskripsi singkat role"
          autoComplete="off"
        />
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Tambah Role
      </Button>
    </form>
  );
}