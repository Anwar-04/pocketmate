import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { invalidateCache } from "@/lib/cache/memoryCache";

const ProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  monthlySalary: z.number().positive("Monthly salary must be greater than 0"),
  salaryDate: z.number().int().min(1).max(31, "Salary date must be between 1 and 31"),
  currentBalance: z.number().min(0, "Current balance cannot be negative").default(0),
  monthlySavingsGoal: z.number().min(0, "Savings goal cannot be negative").default(0),
  upcomingEssentials: z.number().min(0, "Upcoming essentials cannot be negative").default(0),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const profile = await prisma.financialProfile.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json({
      success: true,
      profile: profile || null,
      user,
    });
  } catch (error) {
    console.error("Failed to fetch profile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = ProfileSchema.parse(body);

    // Business rule: Salary must cover fixed essentials + savings goal
    if (validated.monthlySalary < validated.upcomingEssentials + validated.monthlySavingsGoal) {
      return NextResponse.json(
        {
          success: false,
          error: "Committed essentials and savings goal cannot exceed your monthly salary.",
        },
        { status: 400 }
      );
    }

    // Upsert User with their full name
    await prisma.user.upsert({
      where: { id: user.id },
      update: { name: validated.name },
      create: { id: user.id, email: user.email, name: validated.name },
    });

    // Upsert real FinancialProfile in PostgreSQL
    const profile = await prisma.financialProfile.upsert({
      where: { userId: user.id },
      update: {
        monthlySalary: validated.monthlySalary,
        salaryDate: validated.salaryDate,
        currentBalance: validated.currentBalance,
        monthlySavingsGoal: validated.monthlySavingsGoal,
        upcomingEssentials: validated.upcomingEssentials,
      },
      create: {
        userId: user.id,
        monthlySalary: validated.monthlySalary,
        salaryDate: validated.salaryDate,
        currentBalance: validated.currentBalance,
        monthlySavingsGoal: validated.monthlySavingsGoal,
        upcomingEssentials: validated.upcomingEssentials,
      },
    });

    invalidateCache(`dashboard:${user.id}`);

    return NextResponse.json({
      success: true,
      message: "Profile saved successfully",
      profile,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: err.errors[0]?.message || "Invalid input data" },
        { status: 400 }
      );
    }
    console.error("Profile save error:", err);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
