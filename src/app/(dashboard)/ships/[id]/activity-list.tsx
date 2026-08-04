"use client";

import { useTransition } from "react";
import type { ShipActivity } from "@prisma/client";
import { Loader2, Trash2 } from "lucide-react";
import { deleteActivity } from "@/app/actions/ships";
import { statusColor } from "@/lib/ship-status";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ActivityListProps {
  activities: (ShipActivity & { voyageLabel?: string | null })[];
  canManage: boolean;
}

export function ActivityList({ activities, canManage }: ActivityListProps) {
  if (activities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Belum ada aktivitas tercatat.</p>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((act) => (
        <ActivityRow key={act.id} act={act} canManage={canManage} />
      ))}
    </div>
  );
}

function ActivityRow({ act, canManage }: { act: ShipActivity & { voyageLabel?: string | null }; canManage: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-start gap-3 rounded-lg border p-3">
      <span className={cn("mt-1 size-2.5 shrink-0 rounded-full", statusColor(act.status))} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">{act.aktivitas}</p>
          <div className="flex items-center gap-2">
            {act.voyageLabel && (
              <Badge variant="secondary" className="max-w-40 truncate text-xs">
                {act.voyageLabel}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {formatDate(act.tanggal)}
            </Badge>
            {canManage && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                title="Hapus aktivitas"
                disabled={pending}
                onClick={() => {
                  if (!confirm("Hapus aktivitas ini?")) return;
                  startTransition(async () => {
                    await deleteActivity(act.id);
                  });
                }}
              >
                {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              </Button>
            )}
          </div>
        </div>
        {act.catatan && <p className="mt-0.5 text-sm text-muted-foreground">{act.catatan}</p>}
      </div>
    </div>
  );
}