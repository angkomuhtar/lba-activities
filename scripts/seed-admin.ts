import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "password";
const ADMIN_NAME = process.env.ADMIN_NAME ?? "Super Admin";

const SYSTEM_ROLES = [
  {
    name: "superadmin",
    label: "Super Admin",
    description: "Akses penuh, termasuk pengaturan",
    system: true,
  },
  {
    name: "admin",
    label: "Admin",
    description: "Mengelola user, tanpa pengaturan sistem",
    system: true,
  },
  { name: "user", label: "User", description: "Hanya dashboard", system: true },
];

const DEFAULT_PERMISSIONS = [
  {
    id: "dashboard.view",
    label: "Melihat Dashboard",
    description: "Akses halaman dashboard utama",
  },
  {
    id: "user.view",
    label: "Melihat Daftar User",
    description: "Akses daftar user",
  },
  {
    id: "user.manage",
    label: "Kelola User",
    description: "Tambah, ubah role, dan hapus user",
  },
  {
    id: "settings.manage",
    label: "Kelola Pengaturan",
    description: "Mengubah role & permission",
  },
  {
    id: "ship.view",
    label: "Melihat Kapal",
    description: "Lihat dashboard & detail kapal",
  },
  {
    id: "ship.manage",
    label: "Kelola Kapal",
    description: "Input & edit kapal dan data pelayaran",
  },
  {
    id: "activity.manage",
    label: "Input Aktivitas",
    description: "Mencatat aktivitas harian kapal",
  },
  {
    id: "stock.manage",
    label: "Input Fuel Harian",
    description: "Mencatat stok fuel harian kapal",
  },
  {
    id: "document.view",
    label: "Melihat Dokumen",
    description: "Lihat daftar dokumen & notifikasi kedaluwarsa",
  },
  {
    id: "document.manage",
    label: "Kelola Dokumen",
    description: "Tambah, ubah, dan hapus dokumen",
  },
];

const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  superadmin: [
    "dashboard.view",
    "user.view",
    "user.manage",
    "settings.manage",
    "ship.view",
    "ship.manage",
    "activity.manage",
    "stock.manage",
    "document.view",
    "document.manage",
  ],
  admin: [
    "dashboard.view",
    "user.view",
    "user.manage",
    "ship.view",
    "ship.manage",
    "activity.manage",
    "stock.manage",
    "document.view",
    "document.manage",
  ],
  user: ["dashboard.view", "ship.view", "document.view"],
};

const ACTIVITY_CATEGORIES = [
  { nama: "Waiting Order", warna: "merah" },
  { nama: "Perbaikan/Maintenance", warna: "merah" },
  { nama: "Antri Loading", warna: "merah" },
  { nama: "OTW Jetty Loading", warna: "kuning" },
  { nama: "OTW Jetty Bongkar", warna: "kuning" },
  { nama: "Antri Bongkar", warna: "merah" },
  { nama: "Waiting Dokumen", warna: "merah" },
  { nama: "Start Loading", warna: "hijau" },
  { nama: "Finish Loading", warna: "hijau" },
  { nama: "Start Bongkar", warna: "hijau" },
  { nama: "Finish Bongkar", warna: "hijau" },
  { nama: "Loading", warna: "hijau" },
  { nama: "Bongkar", warna: "hijau" },
] as const;

async function seedActivityCategories() {
  for (const cat of ACTIVITY_CATEGORIES) {
    await prisma.activityCategory.upsert({
      where: { nama: cat.nama },
      update: { warna: cat.warna },
      create: { nama: cat.nama, warna: cat.warna },
    });
  }
  console.log("Activity categories siap.");
}

async function seedSystemRoles() {
  for (const role of SYSTEM_ROLES) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {
        label: role.label,
        description: role.description,
        system: role.system,
      },
      create: role,
    });
  }
  console.log("System roles siap.");
}

async function seedPermissions() {
  for (const p of DEFAULT_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { id: p.id },
      update: { label: p.label, description: p.description },
      create: p,
    });
  }
  console.log("Default permissions siap.");
}

async function seedRolePermissions() {
  const roles = await prisma.role.findMany();
  const byName = new Map(roles.map((r) => [r.name, r]));

  for (const [roleName, perms] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    const role = byName.get(roleName);
    if (!role) continue;
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: perms.map((permissionId) => ({ roleId: role.id, permissionId })),
    });
  }
  console.log("Mapping role & permission siap.");
}

async function seedSuperAdmin() {
  const existing = await prisma.user.findUnique({
    where: { username: ADMIN_USERNAME },
  });

  if (existing) {
    console.log(
      `Superadmin sudah ada: ${existing.username}. Tidak ada perubahan.`,
    );
    return;
  }

  const user = await prisma.user.create({
    data: {
      username: ADMIN_USERNAME,
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
      name: ADMIN_NAME,
      role: "superadmin",
      isActive: true,
    },
  });
  console.log(
    `Super Admin berhasil dibuat: ${user.username} (role: ${user.role})`,
  );
}

async function main() {
  await seedSystemRoles();
  await seedPermissions();
  await seedRolePermissions();
  await seedSuperAdmin();
  await seedActivityCategories();
}

main()
  .catch((error) => {
    console.error("Gagal melakukan seed:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
