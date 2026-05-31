const { PrismaClient } = require('./app/generated/prisma');

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`SET GLOBAL sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''))`);
  console.log('Done');
}

main().catch(console.error).finally(() => prisma.$disconnect());
