"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/role-permissions";
import { PERMS } from "@/lib/perm-ids";

export type ActionResult = { error?: string; success?: string } | undefined;

async function requireManage(): Promise<string> {
  const user = await getSessionUser();
  if (!user || !(await can(user.role, PERMS.shipManage))) {
    throw new Error("Anda tidak memiliki izin untuk aksi ini.");
  }
  return user.id;
}

const jettySchema = z.object({
  nama: z.string().min(1, "Nama jetty wajib diisi.").trim(),
  alias: z.string().trim().optional().nullable(),
  location: z.string().trim().optional().nullable(),
  lat: z.string().trim().optional().nullable(),
  lon: z.string().trim().optional().nullable(),
  type: z.enum(["LOADING", "DISCHARGING"]).optional().nullable(),
});

export type JettyFormData = {
  nama: string;
  alias: string | null;
  location: string | null;
  lat: number | null;
  lon: number | null;
  type: "LOADING" | "DISCHARGING" | null;
};

function parseOptionalFloat(value: string | null | undefined): number | null {
  if (!value || value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

async function jettyPayload(
  formData: FormData,
): Promise<{ error: string } | { data: JettyFormData }> {
  const parsed = jettySchema.safeParse({
    nama: formData.get("nama"),
    alias: formData.get("alias") || null,
    location: formData.get("location") || null,
    lat: formData.get("lat") || null,
    lon: formData.get("lon") || null,
    type: formData.get("type") || null,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const lat = parseOptionalFloat(parsed.data.lat);
  const lon = parseOptionalFloat(parsed.data.lon);
  if ((lat === null) !== (lon === null)) {
    return { error: "Latitude dan Longitude harus diisi bersamaan." };
  }
  if (lat !== null && (lat < -90 || lat > 90)) {
    return { error: "Latitude harus berada antara -90 dan 90." };
  }
  if (lon !== null && (lon < -180 || lon > 180)) {
    return { error: "Longitude harus berada antara -180 dan 180." };
  }

  return {
    data: {
      nama: parsed.data.nama,
      alias: parsed.data.alias || null,
      location: parsed.data.location || null,
      lat,
      lon,
      type: parsed.data.type || null,
    },
  };
}

export async function createJetty(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireManage();
  } catch (e) {
    return { error: (e as Error).message };
  }

  const payload = await jettyPayload(formData);
  if ("error" in payload) return payload as ActionResult;

  const dup = await prisma.jetty.findUnique({ where: { nama: payload.data.nama } });
  if (dup) return { error: `Jetty "${payload.data.nama}" sudah terdaftar.` };

  await prisma.jetty.create({ data: payload.data });

  revalidatePath("/jetties");
  revalidatePath("/");
  return { success: "Jetty berhasil ditambahkan." };
}

export async function updateJetty(
  id: string,
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireManage();
  } catch (e) {
    return { error: (e as Error).message };
  }

  const jetty = await prisma.jetty.findUnique({ where: { id } });
  if (!jetty) return { error: "Jetty tidak ditemukan." };

  const payload = await jettyPayload(formData);
  if ("error" in payload) return payload as ActionResult;

  const dup = await prisma.jetty.findFirst({
    where: { nama: payload.data.nama, id: { not: id } },
  });
  if (dup) return { error: `Jetty "${payload.data.nama}" sudah terdaftar.` };

  await prisma.jetty.update({ where: { id }, data: payload.data });

  revalidatePath("/jetties");
  revalidatePath("/");
  return { success: "Jetty berhasil diperbarui." };
}

export async function deleteJetty(id: string): Promise<ActionResult> {
  try {
    await requireManage();
  } catch (e) {
    return { error: (e as Error).message };
  }

  const jetty = await prisma.jetty.findUnique({ where: { id } });
  if (!jetty) return { error: "Jetty tidak ditemukan." };

  await prisma.jetty.delete({ where: { id } });

  revalidatePath("/jetties");
  revalidatePath("/");
  return { success: "Jetty berhasil dihapus." };
}