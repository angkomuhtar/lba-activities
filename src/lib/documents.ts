import "server-only";

import { prisma } from "@/lib/prisma";

export interface ExpiringDocument {
  id: string;
  nama: string;
  nomor: string;
  tglExpire: Date;
  days: number;
  expired: boolean;
}

// Dokumen yang kedaluwarsa dalam N hari ke depan (termasuk yang sudah lewat,
// expired=true), diurutkan dari yang paling mendesak.
export async function getExpiringDocuments(days = 30): Promise<ExpiringDocument[]> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const limit = new Date(today);
  limit.setDate(limit.getDate() + days);

  const docs = await prisma.document.findMany({
    where: {
      tglExpire: { not: null },
    },
    orderBy: { tglExpire: "asc" },
  });

  return docs
    .filter((d) => {
      if (!d.tglExpire) return false;
      return d.tglExpire <= limit;
    })
    .map((d) => {
      const tglExpire = d.tglExpire as Date;
      const diff = Math.floor(
        (tglExpire.getTime() - today.getTime()) / 86400000,
      );
      return {
        id: d.id,
        nama: d.nama,
        nomor: d.nomor,
        tglExpire,
        days: diff,
        expired: diff < 0,
      };
    })
    .sort((a, b) => a.days - b.days);
}
