"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { createUser, type ActionResult } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateUserFormProps {
  roles: { name: string; label: string }[];
}

export function CreateUserForm({ roles }: CreateUserFormProps) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    createUser,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4 rounded-xl border bg-background p-4">
      <div>
        <h2 className="font-semibold">Tambah User</h2>
        <p className="text-sm text-muted-foreground">
          Buat akun baru untuk pengguna.
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
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          name="username"
          placeholder="john.doe"
          autoComplete="off"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Nama lengkap</Label>
        <Input id="name" name="name" placeholder="John Doe" autoComplete="off" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Kata sandi</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Minimal 6 karakter"
          autoComplete="new-password"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <select
          id="role"
          name="role"
          className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
          defaultValue="user"
        >
          {roles.map((role) => (
            <option key={role.name} value={role.name}>
              {role.label}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Tambah User
      </Button>
    </form>
  );
}