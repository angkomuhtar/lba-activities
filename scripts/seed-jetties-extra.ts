import { config as loadEnv } from "dotenv";
import { PrismaClient } from "@prisma/client";

loadEnv({ path: ".env.local" });

const prisma = new PrismaClient();

// Jetty tambahan yang muncul di riwayat voyage/plan lama tapi belum ada di master.
// User memutuskan semua tipe = LOADING agar pilihan muncul di dropdown.
// Seeder ini aman: hanya membuat jetty yang belum ada (by nama), tidak mengubah
// data yang sudah dibuat manual lewat UI.
const EXTRA_JETTIES: { nama: string; location: string }[] = [
  { nama: "Jetty IMIP", location: "Morowali" },
  { nama: "Jetty BTIIG", location: "Morowali" },
  { nama: "Jetty Merpati", location: "Siuna" },
  { nama: "Jetty ABM", location: "Luwuk" },
  { nama: "Jetty MAS", location: "Morowali" },
  { nama: "Jetty PMS", location: "Konawe" },
  { nama: "Jetty Antam", location: "Pakal" },
  { nama: "Jetty Prima", location: "Siuna" },
  { nama: "Jetty BDM", location: "Morowali" },
  { nama: "Jetty Apollo", location: "Konawe Utara" },
  { nama: "Jetty FBK", location: "Kolaka" },
  { nama: "Jetty Tersus TBP", location: "Obi" },
];

async function seedExtraJetties() {
  let dibuat = 0;
  let sudahAda = 0;

  for (const jetty of EXTRA_JETTIES) {
    const ada = await prisma.jetty.findFirst({
      where: { nama: { equals: jetty.nama, mode: "insensitive" } },
    });
    if (ada) {
      sudahAda++;
      console.log(`~ ${jetty.nama} (${jetty.location}) — sudah ada, dilewati`);
      continue;
    }
    await prisma.jetty.create({
      data: {
        nama: jetty.nama,
        location: jetty.location,
        type: "LOADING",
      },
    });
    dibuat++;
    console.log(`+ ${jetty.nama} (${jetty.location}) — LOADING`);
  }

  console.log(`\nSelesai: ${dibuat} jetty dibuat, ${sudahAda} sudah ada.`);
}

seedExtraJetties()
  .catch((error) => {
    console.error("Gagal seed jetty tambahan:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());