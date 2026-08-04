import Link from "next/link";
import {
  LayoutDashboard,
  Settings,
  BarChart3,
  Users,
  ShieldCheck,
  KeyRound,
  Ship,
  PenLine,
  Fuel,
  LogOut,
} from "lucide-react";
import { logout } from "@/app/actions/auth";
import { can } from "@/lib/role-permissions";
import { PERMS } from "@/lib/perm-ids";

interface SidebarProps {
  role: string;
}

export default async function Sidebar({ role }: SidebarProps) {
  const canViewUsers = await can(role, PERMS.userManage);
  const canManageSettings = await can(role, PERMS.settingsManage);
  const canViewShips = await can(role, PERMS.shipView);
  const canManageActivity = await can(role, PERMS.activityManage);
  const canManageStock = await can(role, PERMS.stockManage);

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r bg-card md:flex">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LayoutDashboard className="size-5" />
          </span>
          Dashboard
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        <p className="px-3 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Menu
        </p>
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <LayoutDashboard className="size-4" />
          Dashboard
        </Link>
        <Link
          href="/laporan"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <BarChart3 className="size-4" />
          Laporan
        </Link>

        {canViewShips && (
          <Link
            href="/ships"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Ship className="size-4" />
            Kapal
          </Link>
        )}

        {canManageActivity && (
          <Link
            href="/activities"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <PenLine className="size-4" />
            Aktivitas
          </Link>
        )}

        {canManageStock && (
          <Link
            href="/stocks"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Fuel className="size-4" />
            Fuel Harian
          </Link>
        )}

        {canViewUsers && (
          <Link
            href="/users"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Users className="size-4" />
            Kelola User
          </Link>
        )}

        {canManageSettings && (
          <Link
            href="/roles"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <ShieldCheck className="size-4" />
            Roles
          </Link>
        )}

        {canManageSettings && (
          <Link
            href="/permissions"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <KeyRound className="size-4" />
            Permission
          </Link>
        )}

        <Link
          href="/pengaturan"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <SettingsIcon />
          Pengaturan
        </Link>
      </nav>

      <form action={logout}>
        <div className="border-t p-4">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <LogOut className="size-4" />
            Keluar
          </button>
        </div>
      </form>
    </aside>
  );
}

function SettingsIcon() {
  return <Settings className="size-4" />;
}