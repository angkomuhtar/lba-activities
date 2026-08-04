"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createSession,
  deleteSession,
  findUserByUsername,
  getUserById,
  hashPassword,
  getSessionUser,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { can } from "@/lib/role-permissions";
import { PERMS } from "@/lib/perm-ids";

const loginSchema = z.object({
  username: z.string().min(1, "Username wajib diisi.").trim(),
  password: z.string().min(1, "Kata sandi wajib diisi."),
});

export type LoginState = { error?: string } | undefined;

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { username, password } = parsed.data;
  const user = await findUserByUsername(username);

  if (!user || !user.isActive) {
    return { error: "Username atau kata sandi salah." };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { error: "Username atau kata sandi salah." };
  }

  await createSession({
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  });

  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}

const userSchema = z.object({
  username: z.string().min(3, "Username minimal 3 karakter.").trim().toLowerCase(),
  name: z.string().optional().nullable(),
  password: z.string().min(6, "Kata sandi minimal 6 karakter."),
  role: z.string().min(1, "Role wajib dipilih."),
});

export type ActionResult =
  | { error?: string; success?: string }
  | undefined;

export async function createUser(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !(await can(sessionUser.role, "user.manage"))) {
    return { error: "Anda tidak memiliki izin untuk menambah user." };
  }

  const parsed = userSchema.safeParse({
    username: formData.get("username"),
    name: formData.get("name") || null,
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { username, name, password, role } = parsed.data;
  const existing = await findUserByUsername(username);
  if (existing) {
    return { error: "Username sudah digunakan." };
  }

  const roleExists = await prisma.role.findUnique({ where: { name: role } });
  if (!roleExists) {
    return { error: "Role tidak valid." };
  }

  await prisma.user.create({
    data: {
      username,
      name: name || null,
      passwordHash: await hashPassword(password),
      role,
    },
  });

  revalidatePath("/users");
  return { success: "User berhasil dibuat." };
}

interface UpdateUserInput {
  name?: string | null;
  role?: string;
  password?: string | null;
}

export async function updateUser(
  id: string,
  input: UpdateUserInput,
): Promise<ActionResult> {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !(await can(sessionUser.role, "user.manage"))) {
    return { error: "Anda tidak memiliki izin untuk mengubah user." };
  }

  const target = await getUserById(id);
  if (!target) return { error: "User tidak ditemukan." };

  // Hanya superadmin yang boleh mengubah user superadmin lain.
  if (target.role === "superadmin" && sessionUser.role !== "superadmin") {
    return { error: "Hanya super admin yang dapat mengubah user ini." };
  }

  await prisma.user.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name || null } : {}),
      ...(input.role !== undefined ? { role: input.role } : {}),
      ...(input.password ? { passwordHash: await hashPassword(input.password) } : {}),
    },
  });

  revalidatePath("/users");
  return { success: "User berhasil diperbarui." };
}

export async function deleteUser(id: string): Promise<ActionResult> {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !(await can(sessionUser.role, "user.manage"))) {
    return { error: "Anda tidak memiliki izin untuk menghapus user." };
  }

  const target = await getUserById(id);
  if (!target) return { error: "User tidak ditemukan." };
  if (target.id === sessionUser.id) {
    return { error: "Anda tidak dapat menghapus akun sendiri." };
  }
  if (target.role === "superadmin" && sessionUser.role !== "superadmin") {
    return { error: "Hanya super admin yang dapat menghapus user ini." };
  }

  await prisma.user.delete({ where: { id } });

  revalidatePath("/users");
  return { success: "User berhasil dihapus." };
}

export async function updateProfile(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return { error: "Sesi berakhir, silakan masuk kembali." };

  const password = formData.get("password") as string;
  if (!password || password.length < 6) {
    return { error: "Kata sandi minimal 6 karakter." };
  }

  await prisma.user.update({
    where: { id: sessionUser.id },
    data: { passwordHash: await hashPassword(password) },
  });

  return { success: "Kata sandi berhasil diubah." };
}

const rolePermissionSchema = z.object({
  roleId: z.string().min(1),
  permissions: z.array(z.string()),
});

export async function updateRolePermission(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !(await can(sessionUser.role, PERMS.settingsManage))) {
    return { error: "Anda tidak memiliki izin untuk mengubah role & permission." };
  }

  const parsed = rolePermissionSchema.safeParse({
    roleId: formData.get("roleId"),
    permissions: formData.getAll("permissions").map(String),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { roleId, permissions } = parsed.data;

  await prisma.$transaction([
    prisma.rolePermission.deleteMany({ where: { roleId } }),
    prisma.rolePermission.createMany({
      data: permissions.map((permissionId) => ({ roleId, permissionId })),
    }),
  ]);

  revalidatePath("/roles", "layout");
  revalidatePath("/permissions");
  return { success: "Permission berhasil diperbarui." };
}

const roleSchema = z.object({
  name: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, "Nama role minimal 2 karakter.")
    .regex(/^[a-z0-9_.-]+$/, "Nama role hanya boleh huruf kecil, angka, titik, strip, underscore."),
  label: z.string().min(1, "Label role wajib diisi.").trim(),
  description: z.string().optional().nullable(),
});

export async function createRole(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !(await can(sessionUser.role, PERMS.settingsManage))) {
    return { error: "Anda tidak memiliki izin untuk menambah role." };
  }

  const parsed = roleSchema.safeParse({
    name: formData.get("name"),
    label: formData.get("label"),
    description: formData.get("description") || null,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { name, label, description } = parsed.data;

  try {
    await prisma.role.create({ data: { name, label, description } });
  } catch {
    return { error: "Nama role sudah digunakan." };
  }

  revalidatePath("/roles", "layout");
  return { success: "Role berhasil dibuat." };
}

export async function deleteRole(roleId: string): Promise<ActionResult> {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !(await can(sessionUser.role, PERMS.settingsManage))) {
    return { error: "Anda tidak memiliki izin untuk menghapus role." };
  }

  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) return { error: "Role tidak ditemukan." };
  if (role.system) {
    return { error: "Role sistem tidak dapat dihapus." };
  }

  const inUse = await prisma.user.count({ where: { role: role.name } });
  if (inUse > 0) {
    return { error: "Role sedang dipakai oleh user, tidak dapat dihapus." };
  }

  await prisma.role.delete({ where: { id: roleId } });
  revalidatePath("/roles", "layout");
  return { success: "Role berhasil dihapus." };
}

const permissionSchema = z.object({
  id: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Kode permission minimal 3 karakter.")
    .regex(/^[a-z0-9.]+$/, "Kode permission hanya huruf kecil, angka, dan titik."),
  label: z.string().min(2, "Label wajib diisi.").trim(),
  description: z.string().optional().nullable(),
});

export async function createPermission(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !(await can(sessionUser.role, PERMS.settingsManage))) {
    return { error: "Anda tidak memiliki izin untuk menambah permission." };
  }

  const parsed = permissionSchema.safeParse({
    id: formData.get("id"),
    label: formData.get("label"),
    description: formData.get("description") || null,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { id, label, description } = parsed.data;

  try {
    await prisma.permission.create({ data: { id, label, description } });
  } catch {
    return { error: "Kode permission sudah digunakan." };
  }

  revalidatePath("/permissions");
  return { success: "Permission berhasil dibuat." };
}

export async function deletePermission(permissionId: string): Promise<ActionResult> {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !(await can(sessionUser.role, PERMS.settingsManage))) {
    return { error: "Anda tidak memiliki izin untuk menghapus permission." };
  }

  try {
    await prisma.permission.delete({ where: { id: permissionId } });
  } catch {
    return { error: "Permission sedang dipakai, tidak dapat dihapus." };
  }

  revalidatePath("/permissions");
  return { success: "Permission berhasil dihapus." };
}

export async function updateUserRole(
  userId: string,
  role: string,
): Promise<ActionResult> {
  const sessionUser = await getSessionUser();
  if (!sessionUser || !(await can(sessionUser.role, PERMS.userManage))) {
    return { error: "Anda tidak memiliki izin untuk mengubah role user." };
  }

  const target = await getUserById(userId);
  if (!target) return { error: "User tidak ditemukan." };
  if (target.id === sessionUser.id) {
    return { error: "Anda tidak dapat mengubah role akun sendiri." };
  }
  if (target.role === "superadmin" && sessionUser.role !== "superadmin") {
    return { error: "Hanya super admin yang dapat mengubah super admin." };
  }

  const roleExists = await prisma.role.findUnique({ where: { name: role } });
  if (!roleExists) return { error: "Role tidak valid." };

  await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  revalidatePath("/users");
  return { success: "Role user berhasil diubah." };
}