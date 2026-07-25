const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  await prisma.appUser.deleteMany({ where: { email: 'unknownsales@demo.com' } });
  console.log('Deleted unknownsales');
  await prisma.$disconnect();
}
run();
