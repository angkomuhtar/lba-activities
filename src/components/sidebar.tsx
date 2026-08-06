import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  KeyRound,
  Ship,
  Compass,
  PenLine,
  Fuel,
  FileText,
  BarChart3,
  LogOut,
} from "lucide-react";
import { logout } from "@/app/actions/auth";
import { can } from "@/lib/role-permissions";
import { PERMS } from "@/lib/perm-ids";
import { NavLink } from "@/components/nav-link";
import { NavSubmenu } from "@/components/nav-submenu";

interface SidebarProps {
  role: string;
}

export default async function Sidebar({ role }: SidebarProps) {
  const canViewUsers = await can(role, PERMS.userManage);
  const canManageSettings = await can(role, PERMS.settingsManage);
  const canViewShips = await can(role, PERMS.shipView);
  const canManageActivity = await can(role, PERMS.activityManage);
  const canManageStock = await can(role, PERMS.stockManage);
  const canViewDocuments = await can(role, PERMS.documentView);

  return (
    <aside className='hidden w-64 shrink-0 flex-col border-r bg-card md:flex h-screen'>
      <div className='flex h-16 items-center border-b px-6'>
        <Link href='/' className='flex items-center gap-2 font-semibold'>
          <span className='flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground'>
            <LayoutDashboard className='size-5' />
          </span>
          Dashboard
        </Link>
      </div>

      <nav className='flex-1 space-y-1 p-4'>
        <p className='px-3 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground'>
          Menu
        </p>
        <NavLink
          href='/'
          icon={<LayoutDashboard className='size-4' />}
          label='Dashboard'
        />

        {canViewShips && (
          <NavSubmenu
            icon={<BarChart3 className='size-4' />}
            label='Laporan'
            items={[{ href: '/laporan/aktivitas', label: 'Laporan Aktivitas' }]}
          />
        )}

        {canViewShips && (
          <NavLink
            href='/ships'
            icon={<Ship className='size-4' />}
            label='Kapal'
          />
        )}

        {canViewShips && (
          <NavLink
            href='/voyages'
            icon={<Compass className='size-4' />}
            label='Pelayaran'
          />
        )}

        {canManageActivity && (
          <NavLink
            href='/activities'
            icon={<PenLine className='size-4' />}
            label='Aktivitas'
          />
        )}

        {canManageStock && (
          <NavLink
            href='/stocks'
            icon={<Fuel className='size-4' />}
            label='Fuel Harian'
          />
        )}

        {canViewDocuments && (
          <NavLink
            href='/documents'
            icon={<FileText className='size-4' />}
            label='Document'
          />
        )}

        {canViewUsers && (
          <NavLink
            href='/users'
            icon={<Users className='size-4' />}
            label='Kelola User'
          />
        )}

        {canManageSettings && (
          <NavLink
            href='/roles'
            icon={<ShieldCheck className='size-4' />}
            label='Roles'
          />
        )}

        {canManageSettings && (
          <NavLink
            href='/permissions'
            icon={<KeyRound className='size-4' />}
            label='Permission'
          />
        )}
      </nav>

      <form action={logout}>
        <div className='border-t p-4'>
          <button
            type='submit'
            className='flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground'>
            <LogOut className='size-4' />
            Keluar
          </button>
        </div>
      </form>
    </aside>
  );
}
