import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

const prisma = new PrismaClient();

const DUMMY_CLIENTS = [
  {
    name: "PT. SOLINDO TAMA JAYA",
    company: "PT. SOLINDO TAMA JAYA",
    phone: "0812-3456-7890",
    email: "solindo@mail.com",
    address: "Jl. Tropodo I, 9, Tropodo, Waru, Kab. Sidoarjo, Jawa Timur 61256",
  },
  {
    name: "Bpk. Bachnas",
    company: "Proyek Perumahan Bachnas",
    phone: "0823-8888-9999",
    email: "bachnas@mail.com",
    address: "Jl. Melon Raya No. 79, Surakarta, Jawa Tengah",
  },
  {
    name: "CV. AJM Internal",
    company: "CV. ADITARA JAYA MAKMUR",
    phone: "0823-3666-6366",
    email: "aditarajayamakmur@gmail.com",
    address: "Dsn. Semen, Desa Tanggalrejo, Kec. Mojoagung, Kab. Jombang",
  },
];

async function main() {
  const ownerId = "6272acef-500c-4810-b8fa-e67733d0e310";
  console.log("Seeding clients for owner...");
  
  for (const c of DUMMY_CLIENTS) {
    const exists = await prisma.client.findFirst({
      where: { user_id: ownerId, name: c.name }
    });
    if (exists) {
      console.log(`Client ${c.name} already exists for owner. Skipping.`);
      continue;
    }
    await prisma.client.create({
      data: {
        id: randomUUID(),
        user_id: ownerId,
        name: c.name,
        company: c.company,
        phone: c.phone,
        email: c.email,
        address: c.address,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    });
    console.log(`Added ${c.name} for owner.`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
