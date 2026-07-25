// Script: bersihkan duplikat produk dan isi harga buy_in yang benar
// Jalankan: node scripts/fix_products.js

const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

// Harga buy_in berdasarkan analisis data transaksi April 2026
const BUY_IN_MAP = {
  "K-225": 700000,
  "K-250": 720000,
  "K-300": 740000,
  "K-350": 775000,
  "K-400": 810000,
  "K-450": 850000,
  "K-500": 890000,
};

function getBuyIn(name) {
  for (const [key, val] of Object.entries(BUY_IN_MAP)) {
    if (name.includes(key)) return val;
  }
  return 0;
}

async function main() {
  // 1. Hapus SEMUA produk yang ada dulu
  const deleted = await p.invoicePresetItem.deleteMany();
  console.log(`Menghapus ${deleted.count} produk lama...`);

  // 2. Cari admin/owner untuk jadi pemilik produk
  const adminUser = await p.appUser.findFirst({
    where: { role: { in: ["owner", "admin"] } },
    orderBy: { created_at: "asc" },
  });

  if (!adminUser) {
    console.error("Tidak ada user admin/owner!");
    process.exit(1);
  }

  console.log(`Menggunakan akun: ${adminUser.email}`);

  const now = new Date().toISOString();

  // 3. Buat produk baru yang bersih & lengkap (hanya 1 copy)
  const products = [
    // === BETON READYMIX STANDAR ===
    { name: "Beton K-175", description: "Readymix mutu K-175 / fc'14.53 MPa – Non Struktural", unit_price: 730000, buy_in_price: 670000 },
    { name: "Beton K-200", description: "Readymix mutu K-200 / fc'16.60 MPa – Non Struktural", unit_price: 755000, buy_in_price: 690000 },
    { name: "Beton K-225", description: "Readymix mutu K-225 / fc'18.68 MPa – Struktural ringan", unit_price: 785000, buy_in_price: 710000 },
    { name: "Beton K-250", description: "Readymix mutu K-250 / fc'20.75 MPa – Struktural standar", unit_price: 810000, buy_in_price: 730000 },
    { name: "Beton K-275", description: "Readymix mutu K-275 / fc'22.83 MPa – Struktural menengah", unit_price: 840000, buy_in_price: 755000 },
    { name: "Beton K-300", description: "Readymix mutu K-300 / fc'24.90 MPa – Struktural menengah", unit_price: 865000, buy_in_price: 780000 },
    { name: "Beton K-350", description: "Readymix mutu K-350 / fc'29.05 MPa – Struktural tinggi", unit_price: 910000, buy_in_price: 820000 },
    { name: "Beton K-400", description: "Readymix mutu K-400 / fc'33.20 MPa – Struktural berat", unit_price: 950000, buy_in_price: 855000 },
    { name: "Beton K-450", description: "Readymix mutu K-450 / fc'37.35 MPa – High Strength", unit_price: 1000000, buy_in_price: 900000 },
    { name: "Beton K-500", description: "Readymix mutu K-500 / fc'41.50 MPa – High Strength", unit_price: 1050000, buy_in_price: 950000 },
    // === FORMAT SNI (fc') ===
    { name: "Beton fc'21.7 (K-250)", description: "Readymix fc'21.7 MPa setara K-250 – Format SNI", unit_price: 810000, buy_in_price: 730000 },
    { name: "Beton fc'26.4 (K-300)", description: "Readymix fc'26.4 MPa setara K-300 – Format SNI", unit_price: 865000, buy_in_price: 780000 },
    { name: "Beton fc'29.0 (K-350)", description: "Readymix fc'29.0 MPa setara K-350 – Format SNI", unit_price: 910000, buy_in_price: 820000 },
    { name: "Beton fc'31.2 (K-375)", description: "Readymix fc'31.2 MPa setara K-375 – Format SNI", unit_price: 930000, buy_in_price: 840000 },
    { name: "Beton fc'33.2 (K-400)", description: "Readymix fc'33.2 MPa setara K-400 – Format SNI", unit_price: 950000, buy_in_price: 855000 },
    // === PRODUK TAMBAHAN ===
    { name: "Wiremesh M6", description: "Wiremesh besi M6 per lembar (2.1m x 5.4m)", unit_price: 420000, buy_in_price: 375000 },
    { name: "Wiremesh M8", description: "Wiremesh besi M8 per lembar (2.1m x 5.4m)", unit_price: 620000, buy_in_price: 560000 },
    { name: "Wiremesh M10", description: "Wiremesh besi M10 per lembar (2.1m x 5.4m)", unit_price: 920000, buy_in_price: 840000 },
    { name: "Jasa Finishing Trowel", description: "Jasa finishing permukaan lantai beton dengan mesin trowel – per m²", unit_price: 18000, buy_in_price: 12000 },
    { name: "Jasa Pompa Beton", description: "Jasa sewa pompa concrete pump (mobile/statis) – per m³", unit_price: 35000, buy_in_price: 25000 },
  ];

  let count = 0;
  for (const prod of products) {
    await p.invoicePresetItem.create({
      data: {
        user_id: adminUser.id,
        name: prod.name,
        description: prod.description,
        unit_price: prod.unit_price,
        buy_in_price: prod.buy_in_price,
        tax_rate: 0,
        created_at: now,
        updated_at: now,
      },
    });
    count++;
    console.log(`  ✓ ${prod.name} | Jual: Rp ${prod.unit_price.toLocaleString("id-ID")} | Beli: Rp ${prod.buy_in_price.toLocaleString("id-ID")}`);
  }

  console.log(`\n✅ Selesai! ${count} produk bersih berhasil ditambahkan.`);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
