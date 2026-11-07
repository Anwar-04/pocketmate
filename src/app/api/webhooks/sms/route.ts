import { NextResponse } from "next/server";
import { z } from "zod";
import { parseBankSms } from "@/lib/sms/parser";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { calculateSalaryCycleDates } from "@/lib/financial/salaryCycle";
import { calculateBudgetMetrics } from "@/lib/financial/budget";
import { Category, PaymentMethod } from "@/types/transaction";
import { invalidateCache } from "@/lib/cache/memoryCache";

const SmsPayloadSchema = z.object({
  smsText: z.string().min(5, "SMS text is too short"),
  token: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token") || request.headers.get("x-webhook-token");

    // 1. Identify User
    let userId: string | null = null;

    if (token) {
      try {
        const dbUser = await prisma.user.findUnique({ where: { id: token } });
        if (dbUser) {
          userId = dbUser.id;
        }
      } catch {
        // Fallback
      }
    }

    if (!userId) {
      const sessionUser = await getCurrentUser();
      if (sessionUser) {
        userId = sessionUser.id;
      }
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Valid user session or token required" },
        { status: 401 }
      );
    }

    // 2. Parse Incoming Payload
    let rawText = "";
    try {
      const bodyJson = await request.json();
      const parsed = SmsPayloadSchema.parse(bodyJson);
      rawText = parsed.smsText;
    } catch {
      rawText = await request.text();
    }

    if (!rawText || rawText.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Missing SMS text payload" },
        { status: 400 }
      );
    }

    // 3. Deterministic Regex Parsing
    const parsedSms = parseBankSms(rawText);
    if (!parsedSms || !parsedSms.amount) {
      return NextResponse.json(
        {
          success: false,
          error: "Could not parse monetary transaction from SMS. Unsupported bank format.",
        },
        { status: 422 }
      );
    }

    // 4. Save to Database
    const newTx = await prisma.transaction.create({
      data: {
        userId,
        amount: parsedSms.amount,
        merchant: parsedSms.merchant || "SMS Transaction",
        description: `SMS: ${parsedSms.merchant || "Transaction"}${parsedSms.accountEnding ? ` (A/c ...${parsedSms.accountEnding})` : ""}`,
        category: (parsedSms.category || "Other") as Category,
        type: parsedSms.type || "debit",
        paymentMethod: (parsedSms.paymentMethod || "UPI") as PaymentMethod,
        date: parsedSms.date || new Date(),
        source: "manual",
        isEssential: parsedSms.category === "Rent" || parsedSms.category === "Bills",
      },
    });

    invalidateCache(`dashboard:${userId}`);

    // 5. Recalculate Safe Daily Spend & Cycle Metrics if profile exists
    let newSafeDailySpend: number | undefined;
    let remainingFlexible: number | undefined;
    let daysUntilPayday: number | undefined;

    const profile = await prisma.financialProfile.findUnique({
      where: { userId },
    });

    if (profile) {
      const dbTransactions = await prisma.transaction.findMany({
        where: { userId, type: "debit" },
      });
      const totalSpent = dbTransactions.reduce((acc, t) => acc + t.amount, 0);

      const today = new Date();
      const cycleDates = calculateSalaryCycleDates(profile.salaryDate, today);

      const metrics = calculateBudgetMetrics({
        monthlySalary: profile.monthlySalary,
        totalSpentThisCycle: totalSpent,
        upcomingEssentials: profile.upcomingEssentials,
        savingsGoal: profile.monthlySavingsGoal,
        daysUntilPayday: cycleDates.daysUntilPayday,
        daysElapsed: cycleDates.daysElapsed,
        totalDaysInCycle: cycleDates.totalDaysInCycle,
      });

      newSafeDailySpend = metrics.safeDailySpend;
      remainingFlexible = metrics.flexibleMoney;
      daysUntilPayday = cycleDates.daysUntilPayday;
    }

    return NextResponse.json({
      success: true,
      data: {
        transaction: newTx,
        parsedSms,
        newSafeDailySpend,
        remainingFlexible,
        daysUntilPayday,
      },
      message: `Recorded ₹${parsedSms.amount} at ${parsedSms.merchant || "Merchant"}.`,
    });
  } catch (err) {
    console.error("SMS webhook ingestion error:", err);
    return NextResponse.json(
      { success: false, error: "Internal webhook processing error" },
      { status: 500 }
    );
  }
}
