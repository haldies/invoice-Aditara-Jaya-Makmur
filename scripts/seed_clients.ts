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
  console.log("Fetching all users...");
  const users = await prisma.appUser.findMany({});
  
  if (users.length === 0) {
    console.log("No users found.");
    return;
  }

  console.log(`Seeding clients for ${users.length} users...`);
  
  let insertedCount = 0;
  for (const user of users) {
    // Check if user already has clients
    const existingCount = await prisma.client.count({
      where: { user_id: user.id },
    });
    
    if (existingCount > 0) {
      console.log(`User ${user.email} already has ${existingCount} clients. Skipping.`);
      continue;
    }

    for (const c of DUMMY_CLIENTS) {
      await prisma.client.create({
        data: {
          id: randomUUID(),
          user_id: user.id,
          name: c.name,
          company: c.company,
          phone: c.phone,
          email: c.email,
          address: c.address,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      });
      insertedCount++;
    }
    console.log(`Seeded 3 clients for user: ${user.email}`);
  }

  console.log(`Successfully seeded ${insertedCount} total clients.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
