import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.appUser.findMany({});
  console.log("USERS IN DB:");
  users.forEach(u => console.log(`- ${u.email} (id: ${u.id})`));

  const clients = await prisma.client.findMany({});
  console.log("\nCLIENTS IN DB:");
  clients.forEach(c => console.log(`- ${c.name} (id: ${c.id}, user_id: ${c.user_id})`));

  const invoices = await prisma.invoice.findMany({
    include: { client: true }
  });
  console.log("\nINVOICES IN DB:");
  invoices.forEach(i => console.log(`- ${i.invoice_number} (id: ${i.id}, user_id: ${i.user_id}, client: ${i.client.name})`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
