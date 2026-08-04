"use client";

import { useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { deleteRole } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export function DeleteRoleButton({ roleId }: { roleId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      title="Hapus role"
      disabled={pending}
      onClick={() => {
        if (!confirm("Hapus role ini?")) return;
        startTransition(async () => {
          await deleteRole(roleId);
        });
      }}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Trash2 className="size-4" />
      )}
    </Button>
  );
}