import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/role-permissions";
import { PERMS } from "@/lib/perm-ids";
import { StocksClient } from "./stocks-client";

export const dynamic = "force-dynamic";

export default async function StocksPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!(await can(user.role, PERMS.shipView))) redirect("/");

  const canManage = await can(user.role, PERMS.stockManage);

  const [ships, stocks] = await Promise.all([
    prisma.ship.findMany({
      orderBy: { nama: "asc" },
      select: { id: true, nama: true },
    }),
    prisma.stockRecord.findMany({
      orderBy: [{ tanggal: "desc" }, { createdAt: "desc" }],
      include: { ship: { select: { nama: true } } },
    }),
  ]);

  // Sisa stok terakhir per kapal (untuk stok awal otomatis).
  const prevByShip = new Map<string, string>();
  for (const rec of stocks) {
    if (!prevByShip.has(rec.shipId))
      prevByShip.set(rec.shipId, rec.sisaStok.toString());
  }

  // Default rentang export: awal bulan ini s.d. hari ini.
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const iso = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const defaultFrom = iso(new Date(now.getFullYear(), now.getMonth(), 1));
  const defaultTo = iso(now);

  return (
    <StocksClient
      ships={ships}
      stocks={stocks}
      prevByShip={prevByShip}
      canManage={canManage}
      defaultFrom={defaultFrom}
      defaultTo={defaultTo}
    />
  );
}
