"use client";

import { useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { deletePermission } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export function DeletePermissionButton({ permissionId }: { permissionId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      title="Hapus permission"
      disabled={pending}
      onClick={() => {
        if (!confirm("Hapus permission ini?")) return;
        startTransition(async () => {
          await deletePermission(permissionId);
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