"use client";

import { useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { deleteUser, updateUserRole } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

interface UserActionsProps {
  user: {
    id: string;
    username: string;
    role: string;
    isSelf: boolean;
  };
  roles: { name: string; label: string }[];
}

export function UserActions({ user, roles }: UserActionsProps) {
  const [pending, startTransition] = useTransition();

  function handleRoleChange(role: string) {
    if (role === user.role) return;
    startTransition(async () => {
      await updateUserRole(user.id, role);
    });
  }

  function handleDelete() {
    if (user.isSelf) return;
    if (!confirm(`Hapus user "${user.username}"?`)) return;

    startTransition(async () => {
      await deleteUser(user.id);
    });
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <select
        value={user.role}
        onChange={(e) => handleRoleChange(e.target.value)}
        disabled={user.isSelf || pending}
        className="h-8 rounded-lg border border-input bg-background px-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        title={user.isSelf ? "Tidak dapat mengubah role sendiri" : "Ubah role"}
      >
        {roles.map((role) => (
          <option key={role.name} value={role.name}>
            {role.label}
          </option>
        ))}
      </select>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleDelete}
        disabled={user.isSelf || pending}
        title={user.isSelf ? "Tidak dapat menghapus akun sendiri" : "Hapus"}
      >
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Trash2 className="size-3.5" />
        )}
      </Button>
    </div>
  );
}