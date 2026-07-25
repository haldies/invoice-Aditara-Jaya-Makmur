const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

p.invoicePresetItem.findMany({ orderBy: { name: "asc" }, select: { name: true, unit_price: true, buy_in_price: true } })
  .then(r => r.forEach(i => console.log(`${i.name} | Rp ${i.unit_price.toLocaleString("id-ID")}/m³ | Buy In: Rp ${i.buy_in_price.toLocaleString("id-ID")}/m³`)))
  .then(() => p.$disconnect());
