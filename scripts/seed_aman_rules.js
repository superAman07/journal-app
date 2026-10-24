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

const AMAN_RULES = [
  {
    title: "1. Level Quality: Fresh Day/Week S/R",
    description: "Level untouched for ≥5 sessions, not broken repeatedly, aligned with PDC / VWAP Gap / S-to-R flip.",
    category: "EXECUTION",
  },
  {
    title: "2. Market Context: Momentum Exhaustion",
    description: "Higher Highs broken, VWAP displaced, straight-line approach into level without chop.",
    category: "EXECUTION",
  },
  {
    title: "3. Entry Trigger: 30-50% Fib + Rejection",
    description: "Lowest point of rejection (CE) / Highest (PE). SL 22-23 pts (Risk ₹1,430). Target 54 pts (1:2.3+ RR).",
    category: "RISK",
  },
  {
    title: "4. Hard Filters: Absolute Capital Preservation",
    description: "No trade if choppy/scary, level broken repeatedly, FOMO/urgency, or already 1 trade taken today.",
    category: "PSYCHOLOGY",
  },
  {
    title: "5. Morning Routine (9:00–9:15 AM)",
    description: "Mark pristine levels, assess structure, label day type (Trend/Range/Chop). If Chop → No Trade Day declared.",
    category: "PSYCHOLOGY",
  },
];

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: 'rivalaman123@gmail.com' },
  });

  if (!user) {
    console.log('User rivalaman123@gmail.com not found.');
    return;
  }

  // Clear existing rules if any
  await prisma.tradingRule.deleteMany({
    where: { userId: user.id },
  });

  // Insert rules for Aman
  for (const r of AMAN_RULES) {
    await prisma.tradingRule.create({
      data: {
        userId: user.id,
        title: r.title,
        description: r.description,
        category: r.category,
        isActive: true,
      },
    });
  }

  console.log(`Successfully added ${AMAN_RULES.length} A+ setup rules for Aman in DB.`);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
