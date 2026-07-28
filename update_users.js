const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.appUser.findMany();
  console.log("Current users:", users.map(u => ({ email: u.email, name: u.name, phone: u.phone })));
  
  const updates = [
    { email: "aguse@demo.com", newEmail: "aguse", name: "Agus E", phone: "081234567890" },
    { email: "prapto@demo.com", newEmail: "prapto", name: "Prapto", phone: "081234567891" },
    { email: "rizal@demo.com", newEmail: "rizal", name: "Rizal", phone: "081234567892" },
    { email: "agus@demo.com", newEmail: "agus", name: "Agus", phone: "081234567893" },
    { email: "ajm@demo.com", newEmail: "ajm", name: "Admin AJM", phone: "081234567894" },
    { email: "reyza@demo.com", newEmail: "reyza", name: "Reyza", phone: "081234567895" }
  ];

  for (const update of updates) {
    const user = users.find(u => u.email === update.email || u.email === update.newEmail);
    if (user) {
      await prisma.appUser.update({
        where: { id: user.id },
        data: {
          email: update.newEmail,
          name: update.name,
          phone: update.phone
        }
      });
      console.log(`Updated ${user.email} -> ${update.newEmail} (${update.name})`);
    } else {
      console.log(`User ${update.email} not found in DB`);
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
