export type Role = string;
export type Permission = string;

// Permission default (labels) untuk seeding awal
export const DEFAULT_PERMISSIONS: { id: Permission; label: string; description: string }[] = [
  { id: "dashboard.view", label: "Melihat Dashboard", description: "Akses halaman dashboard utama" },
  { id: "user.view", label: "Melihat Daftar User", description: "Akses daftar user" },
  { id: "user.manage", label: "Kelola User", description: "Tambah, ubah role, dan hapus user" },
  { id: "settings.manage", label: "Kelola Pengaturan", description: "Mengubah role & permission" },
  { id: "ship.view", label: "Melihat Kapal", description: "Lihat dashboard & detail kapal" },
  { id: "ship.manage", label: "Kelola Kapal", description: "Input & edit kapal dan data pelayaran" },
  { id: "activity.manage", label: "Input Aktivitas", description: "Mencatat aktivitas harian kapal" },
  { id: "stock.manage", label: "Input Fuel Harian", description: "Mencatat stok fuel harian kapal" },
];

// Default permission per system role (dipakai seeding & fallback)
export const DEFAULT_ROLE_PERMISSIONS: Record<string, Permission[]> = {
  superadmin: [
    "dashboard.view",
    "user.view",
    "user.manage",
    "settings.manage",
    "ship.view",
    "ship.manage",
    "activity.manage",
    "stock.manage",
  ],
  admin: [
    "dashboard.view",
    "user.view",
    "user.manage",
    "ship.view",
    "ship.manage",
    "activity.manage",
    "stock.manage",
  ],
  user: ["dashboard.view", "ship.view"],
};

// Role bawaan (label) yang ditanam saat seeding
export const DEFAULT_ROLES: { name: string; label: string; description: string }[] = [
  { name: "superadmin", label: "Super Admin", description: "Akses penuh, termasuk pengaturan" },
  { name: "admin", label: "Admin", description: "Mengelola user, tanpa pengaturan sistem" },
  { name: "user", label: "User", description: "Hanya dashboard" },
];