"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/role-permissions";
import { PERMS } from "@/lib/perm-ids";
import { assignVoyageToActivity } from "@/lib/voyages";

export type ActionResult = { error?: string; success?: string } | undefined;

async function requireManage(): Promise<string> {
  const user = await getSessionUser();
  if (!user || !(await can(user.role, PERMS.shipManage))) {
    throw new Error("Anda tidak memiliki izin untuk aksi ini.");
  }
  return user.id;
}

async function requireActivityManage(): Promise<void> {
  const user = await getSessionUser();
  if (!user || !(await can(user.role, PERMS.activityManage))) {
    throw new Error("Anda tidak memiliki izin untuk input aktivitas.");
  }
}

async function requireStockManage(): Promise<void> {
  const user = await getSessionUser();
  if (!user || !(await can(user.role, PERMS.stockManage))) {
    throw new Error("Anda tidak memiliki izin untuk input fuel.");
  }
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

const shipSchema = z.object({
  nama: z.string().min(1, "Nama kapal wajib diisi.").trim(),
  muatan: z.string().trim().optional().nullable(),
});

export type ShipResult = ActionResult;

export async function createShip(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireManage();
  } catch (e) {
    return { error: (e as Error).message };
  }

  const parsed = shipSchema.safeParse({
    nama: formData.get("nama"),
    muatan: formData.get("muatan") || null,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await prisma.ship.create({
    data: {
      nama: parsed.data.nama,
      muatan: parsed.data.muatan || null,
      createdById: (await getSessionUser())?.id,
    },
  });

  revalidatePath("/ships");
  revalidatePath("/");
  return { success: "Kapal berhasil ditambahkan." };
}

export async function deleteShip(id: string): Promise<ActionResult> {
  try {
    await requireManage();
  } catch (e) {
    return { error: (e as Error).message };
  }

  await prisma.ship.delete({ where: { id } });
  revalidatePath("/ships");
  revalidatePath("/");
  return { success: "Kapal berhasil dihapus." };
}

const voyageSchema = z.object({
  ruteAsal: z.string().trim().optional().nullable(),
  ruteTujuan: z.string().trim().optional().nullable(),
  shipper: z.string().trim().optional().nullable(),
  tglStart: z.string().optional().nullable(),
  tglEnd: z.string().optional().nullable(),
  siNomor: z.string().trim().optional().nullable(),
  siTanggal: z.string().optional().nullable(),
  spalNomor: z.string().trim().optional().nullable(),
  spalTanggal: z.string().optional().nullable(),
  catatan: z.string().trim().optional().nullable(),
});

type VoyageData = {
  ruteAsal: string | null;
  ruteTujuan: string | null;
  shipper: string | null;
  tglStart: Date | null;
  tglEnd: Date | null;
  siNomor: string | null;
  siTanggal: Date | null;
  spalNomor: string | null;
  spalTanggal: Date | null;
  catatan: string | null;
};

async function voyagePayload(
  formData: FormData,
): Promise<{ error: string } | { data: VoyageData }> {
  const parsed = voyageSchema.safeParse({
    ruteAsal: formData.get("ruteAsal") || null,
    ruteTujuan: formData.get("ruteTujuan") || null,
    shipper: formData.get("shipper") || null,
    tglStart: formData.get("tglStart") || null,
    tglEnd: formData.get("tglEnd") || null,
    siNomor: formData.get("siNomor") || null,
    siTanggal: formData.get("siTanggal") || null,
    spalNomor: formData.get("spalNomor") || null,
    spalTanggal: formData.get("spalTanggal") || null,
    catatan: formData.get("catatan") || null,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  return {
    data: {
      ruteAsal: parsed.data.ruteAsal || null,
      ruteTujuan: parsed.data.ruteTujuan || null,
      shipper: parsed.data.shipper || null,
      tglStart: parseDate(parsed.data.tglStart),
      tglEnd: parseDate(parsed.data.tglEnd),
      siNomor: parsed.data.siNomor || null,
      siTanggal: parseDate(parsed.data.siTanggal),
      spalNomor: parsed.data.spalNomor || null,
      spalTanggal: parseDate(parsed.data.spalTanggal),
      catatan: parsed.data.catatan || null,
    },
  };
}

export async function createVoyage(
  shipId: string,
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireManage();
  } catch (e) {
    return { error: (e as Error).message };
  }

  const payload = await voyagePayload(formData);
  if ("error" in payload) return payload as ActionResult;

  await prisma.voyage.create({ data: { shipId, ...payload.data } });

  revalidatePath(`/ships/${shipId}`);
  revalidatePath("/ships");
  revalidatePath("/");
  revalidatePath("/voyages");
  return { success: "Pelayaran berhasil ditambahkan." };
}

export async function updateVoyage(
  voyageId: string,
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireManage();
  } catch (e) {
    return { error: (e as Error).message };
  }

  const voyage = await prisma.voyage.findUnique({ where: { id: voyageId } });
  if (!voyage) return { error: "Data pelayaran tidak ditemukan." };

  const payload = await voyagePayload(formData);
  if ("error" in payload) return payload as ActionResult;

  await prisma.voyage.update({ where: { id: voyageId }, data: payload.data });

  revalidatePath(`/ships/${voyage.shipId}`);
  revalidatePath("/ships");
  revalidatePath("/");
  revalidatePath("/voyages");
  return { success: "Data pelayaran berhasil disimpan." };
}

export async function deleteVoyage(voyageId: string): Promise<ActionResult> {
  try {
    await requireManage();
  } catch (e) {
    return { error: (e as Error).message };
  }

  const voyage = await prisma.voyage.findUnique({ where: { id: voyageId } });
  if (!voyage) return { error: "Data pelayaran tidak ditemukan." };

  await prisma.voyage.delete({ where: { id: voyageId } });

  revalidatePath(`/ships/${voyage.shipId}`);
  revalidatePath("/ships");
  revalidatePath("/");
  revalidatePath("/voyages");
  return { success: "Pelayaran berhasil dihapus." };
}

// Selesaikan pelayaran: set Tanggal Selesai = hari ini.
export async function finishVoyage(voyageId: string): Promise<ActionResult> {
  try {
    await requireManage();
  } catch (e) {
    return { error: (e as Error).message };
  }

  const voyage = await prisma.voyage.findUnique({ where: { id: voyageId } });
  if (!voyage) return { error: "Data pelayaran tidak ditemukan." };

  if (voyage.tglEnd) {
    return { error: "Pelayaran ini sudah memiliki tanggal selesai." };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  await prisma.voyage.update({ where: { id: voyageId }, data: { tglEnd: today } });

  revalidatePath(`/ships/${voyage.shipId}`);
  revalidatePath("/ships");
  revalidatePath("/");
  revalidatePath("/voyages");
  return { success: "Pelayaran diselesaikan hari ini." };
}

const activitySchema = z.object({
  tanggal: z.string().min(1, "Tanggal wajib diisi."),
  aktivitas: z.string().min(1, "Aktivitas wajib dipilih."),
  catatan: z.string().trim().optional().nullable(),
});

// Aksi dengan fungsi terpisah agar bisa dipakai form dengan kata kunci berbeda.
export async function createActivity(
  shipId: string,
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireActivityManage();
  } catch (e) {
    return { error: (e as Error).message };
  }

  const parsed = activitySchema.safeParse({
    tanggal: formData.get("tanggal"),
    aktivitas: formData.get("aktivitas"),
    catatan: formData.get("catatan") || null,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const category = await prisma.activityCategory.findUnique({
    where: { nama: parsed.data.aktivitas },
  });

  const tanggal = parseDate(parsed.data.tanggal)!;
  const voyageId = await assignVoyageToActivity(shipId, tanggal);

  if (!voyageId) {
    return {
      error:
        "Belum ada pelayaran yang tersedia untuk kapal ini pada tanggal tersebut. Tambahkan/atur pelayaran dahulu di halaman kapal (Data Pelayaran).",
    };
  }

  const voyage = await prisma.voyage.findUnique({ where: { id: voyageId } });

  await prisma.shipActivity.create({
    data: {
      shipId,
      voyageId,
      tanggal,
      aktivitas: parsed.data.aktivitas,
      status: category?.warna ?? "kuning",
      catatan: parsed.data.catatan || null,
      createdById: (await getSessionUser())?.id,
    },
  });

  revalidatePath(`/ships/${shipId}`);
  revalidatePath("/");
  const voyageLabel = voyage
    ? voyage.ruteAsal || voyage.ruteTujuan
      ? `${voyage.ruteAsal || "?"} → ${voyage.ruteTujuan || "?"}`
      : voyage.siNomor
        ? `SI ${voyage.siNomor}`
        : "Pelayaran"
    : null;
  return { success: voyageLabel ? `Aktivitas berhasil dicatat (${voyageLabel}).` : "Aktivitas berhasil dicatat." };
}

export async function deleteActivity(id: string): Promise<ActionResult> {
  try {
    await requireActivityManage();
  } catch (e) {
    return { error: (e as Error).message };
  }
  const act = await prisma.shipActivity.findUnique({ where: { id } });
  if (!act) return { error: "Aktivitas tidak ditemukan." };

  await prisma.shipActivity.delete({ where: { id } });
  revalidatePath(`/ships/${act.shipId}`);
  revalidatePath("/");
  return { success: "Aktivitas berhasil dihapus." };
}

const stockSchema = z.object({
  tanggal: z.string().min(1, "Tanggal wajib diisi."),
  me: z.coerce.number().min(0, "ME harus angka tidak negatif."),
  ae: z.coerce.number().min(0, "AE harus angka tidak negatif."),
  pengisian: z.coerce.number().min(0, "Pengisian harus angka tidak negatif.").optional().nullable(),
  stokAwal: z.coerce.number().optional().nullable(),
  catatan: z.string().trim().optional().nullable(),
});

export async function createStock(
  shipId: string,
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireStockManage();
  } catch (e) {
    return { error: (e as Error).message };
  }

  const parsed = stockSchema.safeParse({
    tanggal: formData.get("tanggal"),
    me: formData.get("me"),
    ae: formData.get("ae"),
    pengisian: formData.get("pengisian") || 0,
    stokAwal: formData.get("stokAwal") || null,
    catatan: formData.get("catatan") || null,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const D = parseDate(parsed.data.tanggal)!;

  // Stok awal otomatis = sisa stok dari data sebelumnya (kemarin).
  const prev = await prisma.stockRecord.findFirst({
    where: { shipId, tanggal: { lt: D } },
    orderBy: [{ tanggal: "desc" }, { createdAt: "desc" }],
  });

  let stokAwal = prev?.sisaStok;
  if (stokAwal === undefined || stokAwal === null) {
    // Record pertama / belum ada data sebelumnya -> pakai input manual.
    if (parsed.data.stokAwal === undefined || parsed.data.stokAwal === null) {
      return { error: "Belum ada data stok sebelumnya. Isi stok awal secara manual." };
    }
    stokAwal = new Prisma.Decimal(parsed.data.stokAwal);
  }

  const pengisian = new Prisma.Decimal(parsed.data.pengisian ?? 0);
  const sisaStok = stokAwal
    .add(pengisian)
    .sub(new Prisma.Decimal(parsed.data.me))
    .sub(new Prisma.Decimal(parsed.data.ae));

  await prisma.stockRecord.create({
    data: {
      shipId,
      tanggal: D,
      stokAwal,
      pengisian,
      me: new Prisma.Decimal(parsed.data.me),
      ae: new Prisma.Decimal(parsed.data.ae),
      sisaStok,
      catatan: parsed.data.catatan || null,
    },
  });

  revalidatePath(`/ships/${shipId}`);
  revalidatePath("/");
  return { success: `Data fuel berhasil disimpan (sisa = ${sisaStok.toString()}).` };
}

export async function deleteStock(id: string): Promise<ActionResult> {
  try {
    await requireStockManage();
  } catch (e) {
    return { error: (e as Error).message };
  }
  const rec = await prisma.stockRecord.findUnique({ where: { id } });
  if (!rec) return { error: "Data fuel tidak ditemukan." };

  await prisma.stockRecord.delete({ where: { id } });
  revalidatePath(`/ships/${rec.shipId}`);
  revalidatePath("/");
  return { success: "Data fuel berhasil dihapus." };
}