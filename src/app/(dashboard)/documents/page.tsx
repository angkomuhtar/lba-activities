import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/role-permissions";
import { PERMS } from "@/lib/perm-ids";
import { DocumentsClient } from "./documents-client";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!(await can(user.role, PERMS.documentView))) redirect("/");

  const canManage = await can(user.role, PERMS.documentManage);

  const documents = await prisma.document.findMany({
    orderBy: [{ tglExpire: "asc" }, { createdAt: "desc" }],
  });

  const items = documents.map((d) => ({
    id: d.id,
    nama: d.nama,
    nomor: d.nomor,
    tglTerbit: d.tglTerbit ? toInputDate(d.tglTerbit) : null,
    tglExpire: d.tglExpire ? toInputDate(d.tglExpire) : null,
    catatan: d.catatan,
  }));

  return <DocumentsClient documents={items} canManage={canManage} />;
}

function toInputDate(value: Date): string {
  const d = new Date(value);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
