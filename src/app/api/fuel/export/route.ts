import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/role-permissions";
import { PERMS } from "@/lib/perm-ids";
import { formatDate } from "@/lib/format";
import ExcelJS from "exceljs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseDay(value: string | null, endOfDay: boolean): Date | null {
  if (!value) return null;
  const d = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00"}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (!(await can(user.role, PERMS.shipView))) {
    return new Response("Forbidden", { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const shipId = searchParams.get("shipId");

  const from = parseDay(fromParam, false);
  const to = parseDay(toParam, true);
  if (fromParam && !from) return new Response("Tanggal awal tidak valid", { status: 400 });
  if (toParam && !to) return new Response("Tanggal akhir tidak valid", { status: 400 });
  if (from && to && from > to) {
    return new Response("Tanggal awal melebihi tanggal akhir", { status: 400 });
  }

  const records = await prisma.stockRecord.findMany({
    where: {
      ...(shipId ? { shipId } : {}),
      ...(from || to
        ? { tanggal: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
        : {}),
    },
    orderBy: [{ tanggal: "asc" }, { ship: { nama: "asc" } }, { createdAt: "asc" }],
    include: { ship: { select: { nama: true } } },
  });

  const wb = new ExcelJS.Workbook();
  wb.creator = "LBA Activities";
  wb.created = new Date();
  const ws = wb.addWorksheet("Fuel Harian");

  ws.columns = [
    { header: "Tanggal", key: "tanggal", width: 14 },
    { header: "Kapal", key: "kapal", width: 22 },
    { header: "Stok Awal", key: "stokAwal", width: 14 },
    { header: "Pengisian", key: "pengisian", width: 14 },
    { header: "Transfer Masuk", key: "transferMasuk", width: 14 },
    { header: "Transfer Keluar", key: "transferKeluar", width: 14 },
    { header: "ME", key: "me", width: 14 },
    { header: "AE", key: "ae", width: 14 },
    { header: "Pemakaian (ME+AE)", key: "pemakaian", width: 18 },
    { header: "Sisa", key: "sisa", width: 14 },
    { header: "Catatan", key: "catatan", width: 30 },
  ];

  const header = ws.getRow(1);
  header.font = { bold: true };
  header.alignment = { vertical: "middle", horizontal: "center" };
  header.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFEFEF" } };
    cell.border = { bottom: { style: "thin", color: { argb: "FFBFBFBF" } } };
  });

  let totalPengisian = 0;
  let totalTransferMasuk = 0;
  let totalTransferKeluar = 0;
  let totalMe = 0;
  let totalAe = 0;

  for (const rec of records) {
    const me = Number(rec.me);
    const ae = Number(rec.ae);
    const transferMasuk = Number(rec.transferMasuk);
    const transferKeluar = Number(rec.transferKeluar);
    totalPengisian += Number(rec.pengisian);
    totalTransferMasuk += transferMasuk;
    totalTransferKeluar += transferKeluar;
    totalMe += me;
    totalAe += ae;

    const row = ws.addRow({
      tanggal: formatDate(rec.tanggal),
      kapal: rec.ship.nama,
      stokAwal: Number(rec.stokAwal),
      pengisian: Number(rec.pengisian),
      transferMasuk,
      transferKeluar,
      me,
      ae,
      pemakaian: me + ae,
      sisa: Number(rec.sisaStok),
      catatan: rec.catatan ?? "",
    });
    row.getCell("pengisian").numFmt = "#,##0.###";
    row.getCell("stokAwal").numFmt = "#,##0.###";
    row.getCell("transferMasuk").numFmt = "#,##0.###";
    row.getCell("transferKeluar").numFmt = "#,##0.###";
    row.getCell("me").numFmt = "#,##0.###";
    row.getCell("ae").numFmt = "#,##0.###";
    row.getCell("pemakaian").numFmt = "#,##0.###";
    row.getCell("sisa").numFmt = "#,##0.###";
  }

  if (records.length > 0) {
    const totalRow = ws.addRow({
      kapal: "TOTAL",
      pengisian: totalPengisian,
      transferMasuk: totalTransferMasuk,
      transferKeluar: totalTransferKeluar,
      me: totalMe,
      ae: totalAe,
      pemakaian: totalMe + totalAe,
    });
    totalRow.font = { bold: true };
    for (const key of ["pengisian", "transferMasuk", "transferKeluar", "me", "ae", "pemakaian"]) {
      totalRow.getCell(key).numFmt = "#,##0.###";
    }
  }

  ws.autoFilter = { from: "A1", to: `K${records.length + 1}` };
  ws.views = [{ state: "frozen", ySplit: 1 }];

  const buffer = await wb.xlsx.writeBuffer();

  const rangeLabel =
    fromParam || toParam ? `${fromParam || "awal"}_${toParam || "akhir"}` : "semua";
  const filename = `fuel-harian_${rangeLabel}.xlsx`;

  return new Response(buffer as ArrayBuffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
