"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { createPermission, type ActionResult } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreatePermissionForm() {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    createPermission,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4 rounded-xl border bg-background p-4">
      <div>
        <h2 className="font-semibold">Tambah Permission</h2>
        <p className="text-sm text-muted-foreground">
          Buat permission baru yang bisa diberikan ke role.
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
        <Label htmlFor="perm-id">Kode</Label>
        <Input
          id="perm-id"
          name="id"
          placeholder="project.view, laporan.manage, ..."
          autoComplete="off"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="perm-label">Label</Label>
        <Input
          id="perm-label"
          name="label"
          placeholder="Melihat Project"
          autoComplete="off"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="perm-description">Deskripsi (opsional)</Label>
        <Input
          id="perm-description"
          name="description"
          placeholder="Deskripsi permission"
          autoComplete="off"
        />
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Tambah Permission
      </Button>
    </form>
  );
}