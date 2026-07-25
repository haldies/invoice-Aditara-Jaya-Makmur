import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

const prisma = new PrismaClient();

const DUMMY_PRODUCTS = [
  {
    name: "Beton Cor K-225 (Jayamix)",
    description: "Beton readymix standar untuk lantai dua ruko, perumahan, plat dak.",
    unit_price: 750000,
    tax_rate: 0,
  },
  {
    name: "Beton Cor K-250 (Jayamix)",
    description: "Beton readymix untuk struktur kolom, balok, plat lantai kokoh.",
    unit_price: 770000,
    tax_rate: 0,
  },
  {
    name: "Beton Cor K-300 (Jayamix)",
    description: "Beton mutu tinggi untuk rigid jalan, parkiran truk, gudang pabrik.",
    unit_price: 790000,
    tax_rate: 0,
  },
  {
    name: "Beton Cor K-350 (Jayamix)",
    description: "Beton struktural super kuat untuk jembatan, girder, load berat.",
    unit_price: 820000,
    tax_rate: 0,
  },
  {
    name: "Jasa Finishing Trowel Lantai",
    description: "Jasa perataan trowel finish untuk lantai beton halus.",
    unit_price: 18000,
    tax_rate: 0,
  },
  {
    name: "Wiremesh M8 (Lembar)",
    description: "Besi wiremesh anyaman diameter 8mm untuk tulangan dak cor.",
    unit_price: 650000,
    tax_rate: 0,
  },
];

async function main() {
  console.log("Fetching all users in database...");
  const users = await prisma.appUser.findMany({});
  
  if (users.length === 0) {
    console.log("No users found. Run reset_users.ts script first.");
    return;
  }

  console.log(`Seeding products for ${users.length} users...`);
  
  let insertedCount = 0;
  for (const user of users) {
    // Check if the user already has products
    const existingCount = await prisma.invoicePresetItem.count({
      where: { user_id: user.id },
    });
    
    if (existingCount > 0) {
      console.log(`User ${user.email} already has ${existingCount} products. Skipping.`);
      continue;
    }

    for (const prod of DUMMY_PRODUCTS) {
      await prisma.invoicePresetItem.create({
        data: {
          id: randomUUID(),
          user_id: user.id,
          name: prod.name,
          description: prod.description,
          unit_price: prod.unit_price,
          tax_rate: prod.tax_rate,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      });
      insertedCount++;
    }
    console.log(`Seeded 6 concrete products for user: ${user.email}`);
  }

  console.log(`Successfully seeded ${insertedCount} total product presets.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
