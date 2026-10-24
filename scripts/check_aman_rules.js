require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const rawUrl = process.env.DATABASE_URL || "";
const connectionString = rawUrl.includes("?")
  ? `${rawUrl}&sslmode=no-verify`
  : `${rawUrl}?sslmode=no-verify`;

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: 'rivalaman123@gmail.com' },
    include: { tradingRules: true },
  });

  if (!user) {
    console.log('User rivalaman123@gmail.com not found in DB.');
    return;
  }

  console.log(`User found: ${user.name} (${user.id})`);
  console.log(`Existing rules count: ${user.tradingRules.length}`);
  user.tradingRules.forEach((r, idx) => {
    console.log(`  ${idx + 1}. [${r.category}] ${r.title}: ${r.description}`);
  });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
