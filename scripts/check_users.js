const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.appUser.findMany();
  console.table(users.map(u => ({ email: u.email, role: u.role, name: u.name })));
}

main().finally(() => prisma.$disconnect());
