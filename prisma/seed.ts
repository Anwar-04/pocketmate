import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding benchmark persona: Rahul Sharma...");

  // 1. Create or update Demo User
  const user = await prisma.user.upsert({
    where: { id: "demo-user-rahul-001" },
    update: {
      name: "Rahul Sharma",
      email: "rahul.sharma@example.com",
    },
    create: {
      id: "demo-user-rahul-001",
      name: "Rahul Sharma",
      email: "rahul.sharma@example.com",
    },
  });

  console.log("User upserted:", user.name);

  // 2. Create or update Financial Profile
  const profile = await prisma.financialProfile.upsert({
    where: { userId: user.id },
    update: {
      monthlySalary: 60000,
      salaryDate: 1,
      currentBalance: 21500,
      monthlySavingsGoal: 5000,
      upcomingEssentials: 8000,
    },
    create: {
      userId: user.id,
      monthlySalary: 60000,
      salaryDate: 1,
      currentBalance: 21500,
      monthlySavingsGoal: 5000,
      upcomingEssentials: 8000,
    },
  });

  console.log("Financial Profile created:", {
    salary: profile.monthlySalary,
    salaryDay: profile.salaryDate,
    savingsGoal: profile.monthlySavingsGoal,
    essentials: profile.upcomingEssentials,
  });

  // 3. Clear existing demo transactions to prevent duplicate accumulation
  await prisma.transaction.deleteMany({
    where: { userId: user.id },
  });

  // 4. Seed authentic Indian transactions
  const seedTransactions = [
    {
      userId: user.id,
      amount: 18000,
      merchant: "NoBroker Society Rent",
      description: "House Rent for November",
      category: "Rent" as const,
      type: "debit" as const,
      paymentMethod: "NetBanking" as const,
      date: new Date("2026-11-02T10:00:00Z"),
      source: "manual" as const,
      isEssential: true,
    },
    {
      userId: user.id,
      amount: 2500,
      merchant: "BESCOM Electricity",
      description: "Electricity bill payment",
      category: "Bills" as const,
      type: "debit" as const,
      paymentMethod: "UPI" as const,
      date: new Date("2026-11-04T14:30:00Z"),
      source: "manual" as const,
      isEssential: true,
    },
    {
      userId: user.id,
      amount: 4200,
      merchant: "Blinkit Instant",
      description: "Weekly household groceries & veggies",
      category: "Groceries" as const,
      type: "debit" as const,
      paymentMethod: "UPI" as const,
      date: new Date("2026-11-05T19:20:00Z"),
      source: "manual" as const,
      isEssential: false,
    },
    {
      userId: user.id,
      amount: 1499,
      merchant: "Netflix India",
      description: "Premium UHD Monthly Subscription",
      category: "Subscriptions" as const,
      type: "debit" as const,
      paymentMethod: "Card" as const,
      date: new Date("2026-11-07T08:00:00Z"),
      source: "manual" as const,
      isEssential: false,
    },
    {
      userId: user.id,
      amount: 899,
      merchant: "Spotify Premium",
      description: "Family Plan Subscription",
      category: "Subscriptions" as const,
      type: "debit" as const,
      paymentMethod: "Card" as const,
      date: new Date("2026-11-07T08:05:00Z"),
      source: "manual" as const,
      isEssential: false,
    },
    {
      userId: user.id,
      amount: 2400,
      merchant: "Uber India",
      description: "Office commute cabs (7 rides)",
      category: "Transport" as const,
      type: "debit" as const,
      paymentMethod: "UPI" as const,
      date: new Date("2026-11-09T18:40:00Z"),
      source: "manual" as const,
      isEssential: false,
    },
    {
      userId: user.id,
      amount: 3200,
      merchant: "Swiggy Gourmet",
      description: "Weekend dinner delivery with friends",
      category: "Food" as const,
      type: "debit" as const,
      paymentMethod: "UPI" as const,
      date: new Date("2026-11-10T21:15:00Z"),
      source: "manual" as const,
      isEssential: false,
    },
    {
      userId: user.id,
      amount: 2000,
      merchant: "Zomato",
      description: "Biryani & rolls late night orders",
      category: "Food" as const,
      type: "debit" as const,
      paymentMethod: "UPI" as const,
      date: new Date("2026-11-12T23:30:00Z"),
      source: "manual" as const,
      isEssential: false,
    },
    {
      userId: user.id,
      amount: 1500,
      merchant: "Apollo Pharmacy",
      description: "Monthly vitamins and prescription medicine",
      category: "Healthcare" as const,
      type: "debit" as const,
      paymentMethod: "Card" as const,
      date: new Date("2026-11-14T11:00:00Z"),
      source: "manual" as const,
      isEssential: false,
    },
    {
      userId: user.id,
      amount: 1450,
      merchant: "Amazon India",
      description: "Ergonomic laptop stand & mousepad",
      category: "Shopping" as const,
      type: "debit" as const,
      paymentMethod: "Card" as const,
      date: new Date("2026-11-16T15:10:00Z"),
      source: "manual" as const,
      isEssential: false,
    },
    {
      userId: user.id,
      amount: 852,
      merchant: "Chai Point & Local Tea Stalls",
      description: "17 small chai and evening snack purchases",
      category: "Food" as const,
      type: "debit" as const,
      paymentMethod: "UPI" as const,
      date: new Date("2026-11-18T17:00:00Z"),
      source: "manual" as const,
      isEssential: false,
    },
  ];

  await prisma.transaction.createMany({
    data: seedTransactions,
  });

  console.log(`Seeded ${seedTransactions.length} transactions for Rahul Sharma.`);
  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
