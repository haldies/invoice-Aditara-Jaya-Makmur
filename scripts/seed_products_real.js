// Seed produk berdasarkan harga AKTUAL dari REPORT APRIL 2026.xlsx
// Jalankan: node scripts/seed_products_real.js

const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function main() {
  const adminUser = await p.appUser.findFirst({
    where: { role: { in: ["owner", "admin"] } },
    orderBy: { created_at: "asc" },
  });
  if (!adminUser) { console.error("Tidak ada user admin/owner!"); process.exit(1); }
  console.log(`Akun: ${adminUser.email}`);

  // Hapus semua dan isi ulang
  const del = await p.invoicePresetItem.deleteMany();
  console.log(`Hapus ${del.count} produk lama...`);

  const now = new Date().toISOString();

  // Harga berdasarkan rata-rata AKTUAL dari Excel April 2026
  // Format: { name, description, unit_price (deal avg), buy_in_price (buyin avg) }
  const products = [

    // === BETON NORMAL ===
    {
      name: "Beton K-225",
      description: "Readymix mutu K-225 – Struktural ringan. Harga deal bervariasi sesuai proyek.",
      unit_price: 757000,
      buy_in_price: 665000,
    },
    {
      name: "Beton K-250",
      description: "Readymix mutu K-250 – Struktural standar.",
      unit_price: 779000,
      buy_in_price: 723000,
    },
    {
      name: "Beton K-300",
      description: "Readymix mutu K-300 – Struktural menengah. Produk paling banyak terjual.",
      unit_price: 791000,
      buy_in_price: 730000,
    },
    {
      name: "Beton K-325",
      description: "Readymix mutu K-325 – Struktural menengah-atas.",
      unit_price: 790000,
      buy_in_price: 740000,
    },
    {
      name: "Beton K-350",
      description: "Readymix mutu K-350 – Struktural tinggi.",
      unit_price: 805000,
      buy_in_price: 745000,
    },
    {
      name: "Beton K-400",
      description: "Readymix mutu K-400 – Struktural berat.",
      unit_price: 830000,
      buy_in_price: 757000,
    },
    {
      name: "Beton K-500",
      description: "Readymix mutu K-500 – High Strength.",
      unit_price: 838000,
      buy_in_price: 780000,
    },
    {
      name: "Beton FC-25 (fc'25 MPa)",
      description: "Readymix fc'25 MPa format SNI – setara K-300.",
      unit_price: 780000,
      buy_in_price: 755000,
    },

    // === BETON NFA (Non Fine Aggregate / tanpa pasir halus) ===
    {
      name: "Beton K-250 NFA",
      description: "Readymix K-250 Non Fine Aggregate – untuk struktur khusus.",
      unit_price: 830000,
      buy_in_price: 790000,
    },
    {
      name: "Beton K-300 NFA",
      description: "Readymix K-300 Non Fine Aggregate – agregat kasar, kuat tekan tinggi.",
      unit_price: 835000,
      buy_in_price: 768000,
    },
    {
      name: "Beton K-350 NFA",
      description: "Readymix K-350 Non Fine Aggregate.",
      unit_price: 755000,
      buy_in_price: 725000,
    },
    {
      name: "Beton K-400 NFA",
      description: "Readymix K-400 Non Fine Aggregate – untuk pondasi spesial.",
      unit_price: 802000,
      buy_in_price: 760000,
    },

    // === BETON SCREENING ===
    {
      name: "Beton K-300 Screening",
      description: "Readymix K-300 dengan material screening – harga lebih tinggi karena material khusus.",
      unit_price: 837000,
      buy_in_price: 802000,
    },

    // === BETON KHUSUS / SPECIAL PERFORMANCE ===
    {
      name: "Beton K-300 SP-3",
      description: "Readymix K-300 Special Performance 3 hari – early strength.",
      unit_price: 1600000,
      buy_in_price: 1400000,
    },
    {
      name: "Beton K-300 SP-7",
      description: "Readymix K-300 Special Performance 7 hari – untuk konstruksi cepat.",
      unit_price: 1520000,
      buy_in_price: 1200000,
    },
    {
      name: "Beton K-300 SP-14",
      description: "Readymix K-300 Special Performance 14 hari.",
      unit_price: 1380000,
      buy_in_price: 1150000,
    },
    {
      name: "Beton K-400 SP-3",
      description: "Readymix K-400 Special Performance 3 hari – kuat tekan tinggi cepat.",
      unit_price: 1350000,
      buy_in_price: 1300000,
    },

    // === PRODUK NON-BETON ===
    {
      name: "CNP (Cerucuk Nipa Palm)",
      description: "Produk CNP / perkuatan tanah. Harga per satuan.",
      unit_price: 536000,
      buy_in_price: 383000,
    },
    {
      name: "Beton Instant",
      description: "Beton instant / mortar siap pakai – per sak/kg.",
      unit_price: 94000,
      buy_in_price: 71000,
    },
    {
      name: "Wiremesh M6",
      description: "Wiremesh besi M6 per lembar (2.1m x 5.4m)",
      unit_price: 420000,
      buy_in_price: 375000,
    },
    {
      name: "Wiremesh M8",
      description: "Wiremesh besi M8 per lembar (2.1m x 5.4m)",
      unit_price: 620000,
      buy_in_price: 560000,
    },
    {
      name: "Jasa Finishing Trowel",
      description: "Jasa finishing permukaan lantai beton dengan mesin trowel – per m²",
      unit_price: 18000,
      buy_in_price: 12000,
    },
    {
      name: "Jasa Pompa Beton",
      description: "Jasa sewa concrete pump (mobile/statis) – per m³",
      unit_price: 35000,
      buy_in_price: 25000,
    },
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
    const margin = prod.unit_price - prod.buy_in_price;
    console.log(`✓ ${prod.name.padEnd(30)} | Deal: Rp ${prod.unit_price.toLocaleString("id-ID").padStart(10)} | Buy In: Rp ${prod.buy_in_price.toLocaleString("id-ID").padStart(10)} | Margin: Rp ${margin.toLocaleString("id-ID").padStart(8)}`);
  }

  console.log(`\n✅ ${count} produk berhasil diisi ulang dari data aktual Excel!`);
}

main()
  .catch((e) => { console.error("Error:", e); process.exit(1); })
  .finally(() => p.$disconnect());
