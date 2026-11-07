const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
  const tables = await prisma.$queryRawUnsafe("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
  console.log("Tables:", tables);
}
main().finally(() => prisma.$disconnect());
