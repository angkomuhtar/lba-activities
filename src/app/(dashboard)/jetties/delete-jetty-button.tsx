"use client";

import { useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { deleteJetty } from "@/app/actions/jetties";
import { Button } from "@/components/ui/button";

export function DeleteJettyButton({ id, nama }: { id: string; nama: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      title="Hapus jetty"
      disabled={pending}
      onClick={() => {
        if (!confirm(`Hapus jetty "${nama}"?`)) return;
        startTransition(async () => {
          await deleteJetty(id);
        });
      }}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
    </Button>
  );
}