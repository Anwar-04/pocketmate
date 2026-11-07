import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
  });

// Persist prisma singleton across requests and hot-reloads to prevent connection churn
globalForPrisma.prisma = prisma;

export default prisma;

