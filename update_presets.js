const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function getRandomPrice() {
  const prices = [
    750000, 800000, 820000, 850000, 875000, 
    900000, 920000, 950000, 1050000, 1100000, 
    1150000, 1200000, 1300000, 1450000, 1500000
  ];
  return prices[Math.floor(Math.random() * prices.length)];
}

async function main() {
  const items = await prisma.invoicePresetItem.findMany();
  let count = 0;

  for (const item of items) {
    const randomPrice = getRandomPrice();
    await prisma.invoicePresetItem.update({
      where: { id: item.id },
      data: {
        unit_price: randomPrice,
        ajm_price: randomPrice,
        buy_in_price: randomPrice - 50000,
        tax_rate: 11
      }
    });
    count++;
  }

  console.log(`Updated ${count} preset items with varied dummy prices.`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
