"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/role-permissions";
import { PERMS } from "@/lib/perm-ids";

export type ActionResult = { error?: string; success?: string } | undefined;

async function requireDocumentManage(): Promise<string> {
  const user = await getSessionUser();
  if (!user || !(await can(user.role, PERMS.documentManage))) {
    throw new Error("Anda tidak memiliki izin untuk mengelola dokumen.");
  }
  return user.id;
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

const documentSchema = z.object({
  nama: z.string().min(1, "Nama dokumen wajib diisi.").trim(),
  nomor: z.string().min(1, "Nomor dokumen wajib diisi.").trim(),
  tglTerbit: z.string().optional().nullable(),
  tglExpire: z.string().optional().nullable(),
  catatan: z.string().trim().optional().nullable(),
});

type DocumentData = {
  nama: string;
  nomor: string;
  tglTerbit: Date | null;
  tglExpire: Date | null;
  catatan: string | null;
};

async function documentPayload(
  formData: FormData,
): Promise<{ error: string } | { data: DocumentData }> {
  const parsed = documentSchema.safeParse({
    nama: formData.get("nama"),
    nomor: formData.get("nomor"),
    tglTerbit: formData.get("tglTerbit") || null,
    tglExpire: formData.get("tglExpire") || null,
    catatan: formData.get("catatan") || null,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  return {
    data: {
      nama: parsed.data.nama,
      nomor: parsed.data.nomor,
      tglTerbit: parseDate(parsed.data.tglTerbit),
      tglExpire: parseDate(parsed.data.tglExpire),
      catatan: parsed.data.catatan || null,
    },
  };
}

export async function createDocument(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireDocumentManage();
  } catch (e) {
    return { error: (e as Error).message };
  }

  const payload = await documentPayload(formData);
  if ("error" in payload) return payload as ActionResult;

  await prisma.document.create({
    data: {
      ...payload.data,
      createdById: (await getSessionUser())?.id,
    },
  });

  revalidatePath("/documents");
  revalidatePath("/");
  return { success: "Dokumen berhasil ditambahkan." };
}

export async function updateDocument(
  documentId: string,
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireDocumentManage();
  } catch (e) {
    return { error: (e as Error).message };
  }

  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) return { error: "Dokumen tidak ditemukan." };

  const payload = await documentPayload(formData);
  if ("error" in payload) return payload as ActionResult;

  await prisma.document.update({
    where: { id: documentId },
    data: payload.data,
  });

  revalidatePath("/documents");
  revalidatePath("/");
  return { success: "Dokumen berhasil disimpan." };
}

export async function deleteDocument(documentId: string): Promise<ActionResult> {
  try {
    await requireDocumentManage();
  } catch (e) {
    return { error: (e as Error).message };
  }

  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) return { error: "Dokumen tidak ditemukan." };

  await prisma.document.delete({ where: { id: documentId } });

  revalidatePath("/documents");
  revalidatePath("/");
  return { success: "Dokumen berhasil dihapus." };
}
