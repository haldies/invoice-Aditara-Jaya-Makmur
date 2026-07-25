import { PrismaClient } from "@prisma/client";
import * as crypto from "node:crypto";

const prisma = new PrismaClient();

const PASSWORD_ITERATIONS = 120_000;

export function hashPassword(password: string, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, PASSWORD_ITERATIONS, 32, "sha256").toString("hex");
  return { salt, hash };
}

async function main() {
  console.log("Cleaning database...");
  await prisma.appSession.deleteMany({});
  await prisma.invoiceItem.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.invoiceTemplate.deleteMany({});
  await prisma.appUser.deleteMany({});
  
  console.log("Creating Owner...");
  const ownerPass = hashPassword("1234");
  await prisma.appUser.create({
    data: {
      id: crypto.randomUUID(),
      email: "owner@contohinvoice.com",
      password_hash: ownerPass.hash,
      password_salt: ownerPass.salt,
      role: "owner",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  });

  console.log("Creating Admin...");
  const adminPass = hashPassword("1234");
  await prisma.appUser.create({
    data: {
      id: crypto.randomUUID(),
      email: "admin@contohinvoice.com",
      password_hash: adminPass.hash,
      password_salt: adminPass.salt,
      role: "admin",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  });

  console.log("Creating 4 Users...");
  for(let i = 1; i <= 4; i++) {
    const userPass = hashPassword("1234");
    await prisma.appUser.create({
      data: {
        id: crypto.randomUUID(),
        email: `user${i}@contohinvoice.com`,
        password_hash: userPass.hash,
        password_salt: userPass.salt,
        role: "user",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    });
  }

  console.log("Database reset complete.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
