const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const masterCatalogProducts = [
  // BETON
  { name: 'Beton Ready Mix K-225', description: 'Struktural ringan per m³ - pengiriman mixer standar', category: 'BETON', supplier: 'KOKO SUPPLIER', unit_price: 820000, buy_in_price: 760000 },
  { name: 'Beton Ready Mix K-250', description: 'Struktural rumah 2 lantai per m³', category: 'BETON', supplier: 'KOKO SUPPLIER', unit_price: 850000, buy_in_price: 790000 },
  { name: 'Beton Ready Mix K-300', description: 'Struktural K-300 per m³', category: 'BETON', supplier: 'KOKO SUPPLIER', unit_price: 890000, buy_in_price: 820000 },
  { name: 'Beton Ready Mix K-350', description: 'Struktural jembatan & jalan per m³', category: 'BETON', supplier: 'KOKO SUPPLIER', unit_price: 960000, buy_in_price: 890000 },
  { name: 'Beton Fast Track K-400 (3 Hari)', description: 'Early strength 3 hari kering per m³', category: 'BETON', supplier: 'MITRA2', unit_price: 1150000, buy_in_price: 1050000 },
  { name: 'Beton Precast U-Ditch 40x40x120', description: 'Saluran drainase beton bertulang per unit', category: 'BETON', supplier: 'MITRA2', unit_price: 450000, buy_in_price: 390000 },

  // BESI
  { name: 'Wiremesh M6 Polos (2.1m x 5.4m)', description: 'Jaring besi M6 per lembar', category: 'BESI', supplier: 'MITRA1', unit_price: 680000, buy_in_price: 610000 },
  { name: 'Wiremesh M8 Ulir (2.1m x 5.4m)', description: 'Jaring besi M8 ulir per lembar', category: 'BESI', supplier: 'MITRA1', unit_price: 1050000, buy_in_price: 950000 },
  { name: 'Besi Beton Ulir D13 SNI', description: 'Besi ulir D13 12m per batang', category: 'BESI', supplier: 'MITRA1', unit_price: 145000, buy_in_price: 128000 },
  { name: 'Besi Polos TP240 Dia 10mm SNI', description: 'Besi polos 10mm 12m per batang', category: 'BESI', supplier: 'MITRA1', unit_price: 88000, buy_in_price: 76000 },
  { name: 'Besi H-Beam 150x150x7x10 (12m)', description: 'Besi konstruksi H-Beam per batang', category: 'BESI', supplier: 'MITRA3', unit_price: 3450000, buy_in_price: 3100000 },
  { name: 'Baja Ringan C75.75 SNI', description: 'Kanal C baja ringan 0.75mm per batang', category: 'BESI', supplier: 'MITRA3', unit_price: 95000, buy_in_price: 82000 }
];

async function main() {
  const users = await prisma.appUser.findMany();
  const userId = users[0]?.id;
  if (!userId) {
    console.error('No user found');
    return;
  }

  // Clear previous preset items
  await prisma.invoicePresetItem.deleteMany();

  const now = new Date().toISOString();
  for (const item of masterCatalogProducts) {
    await prisma.invoicePresetItem.create({
      data: {
        user_id: userId,
        name: item.name,
        description: item.description,
        category: item.category,
        supplier: item.supplier,
        unit_price: item.unit_price,
        buy_in_price: item.buy_in_price,
        ajm_price: item.unit_price,
        tax_rate: 11,
        created_at: now,
        updated_at: now,
      }
    });
  }

  console.log(`Berhasil mereset katalog: ${masterCatalogProducts.length} produk master unik tanpa duplikasi nama.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
