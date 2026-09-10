import { PrismaClient } from "./client";
import { hashSecret } from "../lib/crypto";
import { DEFAULTS } from "../lib/loyalty";

const prisma = new PrismaClient();

const BRANCHES = [
  { code: "1001", name: "The Dubai Mall", city: "Dubai" },
  { code: "1002", name: "Dubai Hills Mall", city: "Dubai" },
  { code: "1003", name: "Mall of the Emirates", city: "Dubai" },
  { code: "1004", name: "Ibn Battuta Mall", city: "Dubai" },
  { code: "1005", name: "Dubai Festival City", city: "Dubai" },
  { code: "1006", name: "City Centre Deira", city: "Dubai" },
  { code: "1007", name: "City Centre Mirdif", city: "Dubai" },
  { code: "1008", name: "City Centre Shindagha", city: "Dubai" },
  { code: "1009", name: "BurJuman Centre", city: "Dubai" },
  { code: "1010", name: "Arabian Centre", city: "Dubai" },
  { code: "1011", name: "Oasis Mall", city: "Dubai" },
  { code: "1012", name: "City Centre Sharjah", city: "Sharjah" },
  { code: "1013", name: "City Centre Al Zahia", city: "Sharjah" },
  { code: "1014", name: "City Centre Ajman", city: "Ajman" },
];

const REWARDS = [
  {
    key: "welcome",
    name: "Welcome discount",
    description: "10% off your first bill",
    type: "WELCOME" as const,
    threshold: 0,
    value: 10,
    isPercent: true,
    validDays: 30,
  },
  {
    key: "points500",
    name: "AED 25 reward",
    description: "Unlocked at 500 points",
    type: "POINTS" as const,
    threshold: 500,
    value: 25,
    isPercent: false,
    validDays: 60,
  },
  {
    key: "visits5",
    name: "Free item",
    description: "A free item on every 5th visit",
    type: "VISITS" as const,
    threshold: 5,
    value: 0,
    isPercent: false,
    validDays: 30,
  },
  {
    key: "birthday",
    name: "Birthday voucher",
    description: "A treat during your birthday month",
    type: "BIRTHDAY" as const,
    threshold: 0,
    value: 0,
    isPercent: false,
    validDays: 31,
  },
  {
    key: "referral",
    name: "Referral bonus",
    description: "100 points for bringing a friend",
    type: "REFERRAL" as const,
    threshold: 0,
    value: 100,
    isPercent: false,
    validDays: null,
  },
];

async function main() {
  console.log("Seeding database…\n");

  // ---- settings
  for (const [key, value] of Object.entries(DEFAULTS)) {
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
  }
  console.log(`  settings   ${Object.keys(DEFAULTS).length} keys`);

  // ---- branches
  const branchIds: string[] = [];
  for (const b of BRANCHES) {
    const row = await prisma.branch.upsert({
      where: { code: b.code },
      update: { name: b.name, city: b.city, isActive: true },
      create: {
        code: b.code,
        name: b.name,
        city: b.city,
        address: `${b.name}, ${b.city}`,
        hours: "10:00 – 00:00",
      },
    });
    branchIds.push(row.id);
  }
  console.log(`  branches   ${branchIds.length}`);

  // ---- rewards
  let rewardCount = 0;
  for (const r of REWARDS) {
    const existing = await prisma.reward.findFirst({ where: { name: r.name } });
    if (!existing) {
      await prisma.reward.create({
        data: {
          name: r.name,
          description: r.description,
          type: r.type,
          threshold: r.threshold,
          value: r.value,
          isPercent: r.isPercent,
          validDays: r.validDays,
        },
      });
    }
    rewardCount += 1;
  }
  console.log(`  rewards    ${rewardCount}`);

  // ---- staff
  const staff = [
    { username: "admin", name: "System Admin", pin: "246810", role: "SUPER_ADMIN" as const, branchId: null },
    { username: "manager", name: "Branch Manager", pin: "135790", role: "BRANCH_MANAGER" as const, branchId: branchIds[0] },
    { username: "cashier", name: "Counter Staff", pin: "112233", role: "CASHIER" as const, branchId: branchIds[0] },
  ];

  for (const s of staff) {
    const existing = await prisma.staff.findUnique({ where: { username: s.username } });
    if (!existing) {
      await prisma.staff.create({
        data: {
          username: s.username,
          name: s.name,
          pinHash: await hashSecret(s.pin),
          role: s.role,
          branchId: s.branchId,
        },
      });
    }
  }
  console.log(`  staff      ${staff.length}`);

  console.log("\nDone seeding.");
  console.log("Default staff PINs (change in production):");
  staff.forEach((s) => console.log(`  ${s.username.padEnd(9)} ${s.pin}  (${s.role})`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
