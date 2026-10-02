import { config as loadEnv } from "dotenv";
import { PrismaClient } from "@prisma/client";

loadEnv({ path: ".env.local" });

const prisma = new PrismaClient();

const STOP_WORDS = new Set(["tj", "tanjung", "pulau", "kab", "kabupaten", "kota", "utara", "timur", "barat", "selatan"]);

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\/\-,\.:]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter((w) => !STOP_WORDS.has(w))
    .join(" ");
}

// Varian lengkap sebuah jetty: nama saja, nama+lokasi, dan tiap alias.
function variants(jetty: { nama: string; location: string | null; alias: string | null }): string[] {
  const out = new Set<string>();
  out.add(normalize(jetty.nama));
  if (jetty.location) {
    out.add(normalize(`${jetty.nama} ${jetty.location}`));
    out.add(normalize(`${jetty.nama},${jetty.location}`));
  }
  for (const a of (jetty.alias ?? "").split("|")) {
    const v = normalize(a);
    if (v) out.add(v);
  }
  return [...out];
}

async function buildLookup() {
  const jetties = await prisma.jetty.findMany();
  const lookup = new Map<string, { id: string; nama: string }>();

  for (const j of jetties) {
    for (const v of variants(j)) {
      if (!lookup.has(v)) lookup.set(v, { id: j.id, nama: j.nama });
    }
  }
  return lookup;
}

function resolve(
  lookup: Map<string, { id: string; nama: string }>,
  value: string | null | undefined,
): { id: string; nama: string } | null {
  if (!value || value.trim() === "") return null;
  return lookup.get(normalize(value)) ?? null;
}

type Job = {
  find: () => Promise<{ id: string; ruteAsal: string | null; ruteTujuan: string | null }[]>;
  update: (id: string, data: { ruteAsalId?: string; ruteTujuanId?: string }) => Promise<unknown>;
  label: string;
};

async function run(jobs: Job[], lookup: Awaited<ReturnType<typeof buildLookup>>, unmatched: Map<string, number>) {
  for (const job of jobs) {
    const rows = await job.find();
    let asal = 0;
    let tujuan = 0;
    for (const row of rows) {
      const data: { ruteAsalId?: string; ruteTujuanId?: string } = {};
      if (!row.ruteAsal) continue;

      const asalJetty = resolve(lookup, row.ruteAsal);
      if (asalJetty) {
        data.ruteAsalId = asalJetty.id;
        asal++;
      } else {
        unmatched.set(row.ruteAsal, (unmatched.get(row.ruteAsal) ?? 0) + 1);
      }

      const tujuanJetty = resolve(lookup, row.ruteTujuan);
      if (tujuanJetty) {
        data.ruteTujuanId = tujuanJetty.id;
        tujuan++;
      } else if (row.ruteTujuan) {
        unmatched.set(row.ruteTujuan, (unmatched.get(row.ruteTujuan) ?? 0) + 1);
      }

      if (Object.keys(data).length) await job.update(row.id, data);
    }
    console.log(`${job.label}: ruteAsal ter-link ${asal}, ruteTujuan ter-link ${tujuan}.`);
  }
}

async function main() {
  const lookup = await buildLookup();
  console.log(`Lookup: ${lookup.size} varian siap dicocokkan.\n`);

  const unmatched = new Map<string, number>();
  const jobs: Job[] = [
    {
      label: "Voyage",
      find: () =>
        prisma.voyage.findMany({
          select: { id: true, ruteAsal: true, ruteTujuan: true },
        }),
      update: (id, data) => prisma.voyage.update({ where: { id }, data }),
    },
    {
      label: "VoyagePlan",
      find: () =>
        prisma.voyagePlan.findMany({
          select: { id: true, ruteAsal: true, ruteTujuan: true },
        }),
      update: (id, data) => prisma.voyagePlan.update({ where: { id }, data }),
    },
  ];

  await run(jobs, lookup, unmatched);

  const sorted = [...unmatched.entries()].sort((a, b) => b[1] - a[1]);
  if (sorted.length) {
    console.log(`\nBelum cocok (${sorted.length} variasi, total ${[...unmatched.values()].reduce((a, b) => a + b, 0)} baris):`);
    for (const [rute, count] of sorted) console.log(`  - ${rute} (${count}x)`);
  } else {
    console.log("\nSemua rute cocok dengan master jetty.");
  }
}

main()
  .catch((error) => {
    console.error("Gagal backfill:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());