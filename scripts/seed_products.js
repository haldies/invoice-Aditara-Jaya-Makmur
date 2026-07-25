// Script untuk seed produk beton readymix ke database
// Jalankan: node scripts/seed_products.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Cari user pertama yang ada (admin/owner) untuk jadi pemilik produk ini
  const adminUser = await prisma.appUser.findFirst({
    where: { role: { in: ["owner", "admin", "manager"] } },
    orderBy: { created_at: "asc" },
  });

  if (!adminUser) {
    console.error("Tidak ada user admin/owner ditemukan di database!");
    process.exit(1);
  }

  console.log(`Menggunakan akun: ${adminUser.email} (${adminUser.role})`);

  // Cek apakah sudah ada produk
  const existingCount = await prisma.invoicePresetItem.count();
  if (existingCount > 0) {
    console.log(`Sudah ada ${existingCount} produk di database. Skip seed.`);
    process.exit(0);
  }

  // Daftar produk beton readymix berdasarkan data Excel April 2026
  // Harga estimasi berdasarkan pola transaksi yang ada
  const products = [
    // === BETON NORMAL (STRUKTURAL) ===
    {
      name: "Beton K-175",
      description: "Readymix mutu K-175 / fc' 14.53 MPa – Non Struktural",
      unit_price: 750000,
      buy_in_price: 680000,
    },
    {
      name: "Beton K-200",
      description: "Readymix mutu K-200 / fc' 16.60 MPa – Non Struktural",
      unit_price: 775000,
      buy_in_price: 700000,
    },
    {
      name: "Beton K-225",
      description: "Readymix mutu K-225 / fc' 18.68 MPa – Struktural ringan",
      unit_price: 800000,
      buy_in_price: 725000,
    },
    {
      name: "Beton K-250",
      description: "Readymix mutu K-250 / fc' 20.75 MPa – Struktural standar",
      unit_price: 830000,
      buy_in_price: 750000,
    },
    {
      name: "Beton K-275",
      description: "Readymix mutu K-275 / fc' 22.83 MPa – Struktural menengah",
      unit_price: 855000,
      buy_in_price: 775000,
    },
    {
      name: "Beton K-300",
      description: "Readymix mutu K-300 / fc' 24.90 MPa – Struktural menengah",
      unit_price: 880000,
      buy_in_price: 800000,
    },
    {
      name: "Beton K-350",
      description: "Readymix mutu K-350 / fc' 29.05 MPa – Struktural tinggi",
      unit_price: 920000,
      buy_in_price: 840000,
    },
    {
      name: "Beton K-400",
      description: "Readymix mutu K-400 / fc' 33.20 MPa – Struktural berat",
      unit_price: 960000,
      buy_in_price: 875000,
    },
    {
      name: "Beton K-450",
      description: "Readymix mutu K-450 / fc' 37.35 MPa – High Strength",
      unit_price: 1005000,
      buy_in_price: 920000,
    },
    {
      name: "Beton K-500",
      description: "Readymix mutu K-500 / fc' 41.50 MPa – High Strength",
      unit_price: 1055000,
      buy_in_price: 960000,
    },

    // === BETON KHUSUS ===
    {
      name: "Beton fc' 25",
      description: "Readymix fc' 25 MPa (setara K-300) – SNI format",
      unit_price: 880000,
      buy_in_price: 800000,
    },
    {
      name: "Beton fc' 30",
      description: "Readymix fc' 30 MPa (setara K-350) – SNI format",
      unit_price: 920000,
      buy_in_price: 840000,
    },
    {
      name: "Beton fc' 35",
      description: "Readymix fc' 35 MPa (setara K-400) – SNI format",
      unit_price: 965000,
      buy_in_price: 880000,
    },

    // === BETON EXPOSE / FINISHING ===
    {
      name: "Beton Expose K-300",
      description: "Readymix mutu K-300 finishing expose – permukaan halus",
      unit_price: 950000,
      buy_in_price: 855000,
    },
    {
      name: "Beton Expose K-350",
      description: "Readymix mutu K-350 finishing expose – permukaan halus",
      unit_price: 990000,
      buy_in_price: 895000,
    },

    // === BETON KHUSUS / TAMBAHAN ===
    {
      name: "Beton Massa / Mass Concrete",
      description: "Readymix untuk pondasi masif / bendungan – suhu rendah",
      unit_price: 920000,
      buy_in_price: 840000,
    },
    {
      name: "Beton Self Compacting (SCC)",
      description: "Readymix Self Compacting Concrete – tanpa pemadatan manual",
      unit_price: 1100000,
      buy_in_price: 1000000,
    },
    {
      name: "Beton Retarder",
      description: "Readymix dengan bahan retarder untuk jarak jauh / cuaca panas",
      unit_price: 900000,
      buy_in_price: 820000,
    },
  ];

  const now = new Date().toISOString();
  let count = 0;

  for (const product of products) {
    await prisma.invoicePresetItem.create({
      data: {
        user_id: adminUser.id,
        name: product.name,
        description: product.description,
        unit_price: product.unit_price,
        buy_in_price: product.buy_in_price,
        tax_rate: 0,
        created_at: now,
        updated_at: now,
      },
    });
    count++;
    console.log(`  ✓ ${product.name} – Rp ${product.unit_price.toLocaleString("id-ID")}/m³`);
  }

  console.log(`\n✅ Selesai! ${count} produk berhasil ditambahkan ke database.`);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
