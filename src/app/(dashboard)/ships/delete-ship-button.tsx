"use client";

import { useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { deleteShip } from "@/app/actions/ships";
import { Button } from "@/components/ui/button";

export function DeleteShipButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      title="Hapus kapal"
      disabled={pending}
      onClick={() => {
        if (!confirm(`Hapus kapal "${name}" beserta seluruh datanya?`)) return;
        startTransition(async () => {
          await deleteShip(id);
        });
      }}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
    </Button>
  );
}