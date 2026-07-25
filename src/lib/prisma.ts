if (process.env.DEBUG) {
  process.env.DEBUG = process.env.DEBUG
    .split(",")
    .map((s) => s.trim())
    .filter((s) => !s.startsWith("prisma:"))
    .join(",");
}

import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
