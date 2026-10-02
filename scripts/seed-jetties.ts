import { config as loadEnv } from "dotenv";
import { PrismaClient } from "@prisma/client";

loadEnv({ path: ".env.local" });

const prisma = new PrismaClient();

type SeedJetty = {
  nama: string;
  alias?: string[];
  location?: string | null;
  type: "LOADING" | "DISCHARGING";
};

// Sumber: data master yang diberikan pengguna (LOADING / DISCHARGING).
// nama = identitas jetty (tanpa lokasi), location = lokasi fisik (mis. Kolonodale).
// alias = varian ejaan/nama penuh yang pernah dipakai di riwayat voyage,
// dipakai untuk pencocokan (backfill) data lama -> jetty.
const JETTIES: SeedJetty[] = [
  // ── LOADING ────────────────────────────────────────────────
  { nama: "Jetty Selaras", location: "Sium Batu", alias: ["Jetty Selaras Maju,Siumbatu", "Jetty Selaras, Sium Batu"], type: "LOADING" },
  { nama: "Jetty SDA", location: "Tj. Buli", alias: ["Jetty SDA Buli", "Jetty, SDA, Buli", "Jetty SDA, Buli", "Jetty SDA, Tj. Buli"], type: "LOADING" },
  { nama: "Jetty AKP", location: "Lameruru", alias: ["jetty AKP, Lameru", "Jetty AKP, Lameruru"], type: "LOADING" },
  { nama: "Jetty KMM", location: "Kolonodale", alias: ["Jetty KMM,Kolonedale", "Jetty KMM, Kolonodale"], type: "LOADING" },
  { nama: "Jetty SAP", location: "Kolonodale", alias: ["Jetty SAP,Kolonedale", "Jetty SAP, Kodal", "Jetty SAP, Kolonodale"], type: "LOADING" },
  { nama: "Jetty PBY", location: "Kolonodale", alias: ["Jetty PBY,Kolonedale", "Jetty PBY, Kolonodale"], type: "LOADING" },
  { nama: "Jetty PMS / Akarmas", location: "Pomala", alias: ["Jetty Akarmas / PMS, Pomala", "Jetty Akar Mas,Pomala", "Jetty PMS, Pomala", "Jetty PMS / Akarmas, Pomala"], type: "LOADING" },
  { nama: "Jetty MPS", location: "Siuna", alias: ["Jetty MPS, Siuna"], type: "LOADING" },
  { nama: "Jetty Mahligai", alias: ["Jetty Mahligai"], type: "LOADING" },
  { nama: "Jetty BKA", location: "Konawe", alias: ["Jetty BKA,Konawe", "Jetty BKA, Konawe"], type: "LOADING" },
  { nama: "Jetty CLM", location: "Malili", alias: ["Jetty CLM,Malili", "Jetty CLM, Malili"], type: "LOADING" },
  { nama: "Jetty Ceria", alias: ["Jetty Ceria"], type: "LOADING" },
  { nama: "Jetty STS", location: "Tj. Buli", alias: ["Jetty STS, Tj. Buli"], type: "LOADING" },
  { nama: "Jetty Penta", location: "Siuna", alias: ["Jetty Penta,Siuna", "jetty Penta,Siuna", "Jetty Penta, Siuna"], type: "LOADING" },
  { nama: "Jetty ASM", location: "Gebe", alias: ["Jetty ASM, Gebe"], type: "LOADING" },
  { nama: "Jetty GAG", location: "Papua Barat", alias: ["Jetty GAG, Papua Barat"], type: "LOADING" },
  { nama: "Jetty AJP", location: "Subaim", alias: ["Jetty AJP, Subaim"], type: "LOADING" },
  { nama: "Jetty Tiran", alias: ["Jetty Tiran Indonesia", "Jetty Tiran"], type: "LOADING" },
  { nama: "Jetty BSM", location: "Lameruru", alias: ["Jetty BSM, Lameruru"], type: "LOADING" },
  { nama: "Jetty AHB", location: "Kabaena", alias: ["Jetty AHB, Kabaena"], type: "LOADING" },
  { nama: "Jetty BRR", location: "Donggala", alias: ["Jetty BRR, Donggala"], type: "LOADING" },

  // ── DISCHARGING ────────────────────────────────────────────
  { nama: "Jetty GPS", location: "Pulau OBI", alias: ["Jetty GPS, Obi", "Jetty GPS,Obi", "Jetty GPS, OBI", "Jetty GPS, Pulau OBI"], type: "DISCHARGING" },
  { nama: "Jetty VDNI / OSS / PMS", location: "Morosi", alias: ["Jetty VDNI / OSS / PMS, Morosi"], type: "DISCHARGING" },
  { nama: "IWIP", location: "Weda", alias: ["Jetty IWIP,Weda", "Jetty IWIP, Weda", "IWIP, Weda"], type: "DISCHARGING" },
  { nama: "Jetty NNI / GNI", alias: ["Jetty NNI/GNI,Kodal", "Jetty NNI / GNI"], type: "DISCHARGING" },
  { nama: "KFI", location: "Sanga - Sanga", alias: ["KFI, Sanga - Sanga"], type: "DISCHARGING" },
  { nama: "FeNi Antam", location: "Halmahera Timur", alias: ["FeNi Antam, Halmahera Timur"], type: "DISCHARGING" },
  { nama: "IPIP", location: "Pomala", alias: ["IPIP, Pomala"], type: "DISCHARGING" },
];

async function seedJetties() {
  // Tabel master jetty kini direferensikan voyages/voyage_plans via FK,
  // jadi reset & isi ulang hanya aman bila tabel referensi sudah dikosongkan.
  await prisma.jetty.deleteMany();
  console.log("Tabel jetty di-reset.\n");

  for (const jetty of JETTIES) {
    const alias = jetty.alias?.join(" | ") ?? null;
    await prisma.jetty.create({
      data: {
        nama: jetty.nama,
        alias,
        location: jetty.location ?? null,
        type: jetty.type,
      },
    });
    console.log(`+ ${jetty.nama}${jetty.location ? ` (${jetty.location})` : ""} — ${jetty.type}`);
  }

  console.log(`\nSelesai: ${JETTIES.length} jetty dimasukkan.`);
}

seedJetties()
  .catch((error) => {
    console.error("Gagal melakukan seed jetty:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());