const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const invoices = await prisma.invoice.findMany();
  let updatedCount = 0;

  for (const inv of invoices) {
    const dateObj = new Date(inv.issue_date || Date.now());
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}${mm}${dd}`;

    const invNum = inv.invoice_number || "";
    // If it's already in the new format, skip
    if (invNum.includes(dateStr)) continue;

    const parts = invNum.split("-");
    const urut = parts.length > 1 ? parts[parts.length - 1] : invNum;

    const newInvNum = `INV-${dateStr}-${urut}`;

    await prisma.invoice.update({
      where: { id: inv.id },
      data: { invoice_number: newInvNum }
    });
    console.log(`Updated ${invNum} -> ${newInvNum}`);
    updatedCount++;
  }

  console.log(`Finished updating ${updatedCount} invoices.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
