"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { updateRolePermission, type ActionResult } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { ReactNode } from "react";

interface RolePermissionEditorProps {
  roleId: string;
  roleLabel: string;
  roleDescription: string | null;
  permissions: { id: string; label: string }[];
  selected: Set<string>;
  actions?: ReactNode;
}

export function RolePermissionEditor({
  roleId,
  roleLabel,
  roleDescription,
  permissions,
  selected,
  actions,
}: RolePermissionEditorProps) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    updateRolePermission,
    undefined,
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <h3 className="font-semibold">{roleLabel}</h3>
          {roleDescription && (
            <p className="text-sm text-muted-foreground">{roleDescription}</p>
          )}
        </div>
        {actions}
      </CardHeader>
      <CardContent className="space-y-3">
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="roleId" value={roleId} />
          <div className="space-y-2">
            {permissions.map((permission) => (
              <label
                key={permission.id}
                className="flex items-start gap-3 rounded-lg border p-3 text-sm"
              >
                <input
                  type="checkbox"
                  name="permissions"
                  value={permission.id}
                  defaultChecked={selected.has(permission.id)}
                  className="mt-0.5 size-4"
                />
                <span>{permission.label}</span>
              </label>
            ))}
          </div>

          <Button type="submit" size="sm" disabled={pending} className="w-full">
            {pending && <Loader2 className="size-3.5 animate-spin" />}
            Simpan
          </Button>

          {state?.success && (
            <p className="rounded-md bg-emerald-500/10 px-3 py-2 text-xs text-emerald-600">
              {state.success}
            </p>
          )}
          {state?.error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {state.error}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}