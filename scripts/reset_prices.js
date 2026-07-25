const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
p.invoicePresetItem.updateMany({ data: { unit_price: 0, buy_in_price: 0 } })
  .then(r => console.log("Updated:", r.count, "items — harga dikosongkan di katalog"))
  .then(() => p.$disconnect());
