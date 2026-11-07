import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  const databaseUrl = process.env.DATABASE_URL || "";

  const results: {
    status: "healthy" | "partial" | "error";
    timestamp: string;
    auth: {
      provider: string;
      status: "connected" | "error" | "unconfigured";
      url: string;
      details?: string;
    };
    database: {
      type: string;
      status: "connected" | "disconnected" | "local_fallback";
      tables?: {
        users: number;
        transactions: number;
        financialProfiles: number;
      };
      error?: string;
      instruction?: string;
    };
  } = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    auth: {
      provider: "Supabase Auth",
      status: "unconfigured",
      url: supabaseUrl,
    },
    database: {
      type: "PostgreSQL (Prisma ORM)",
      status: "disconnected",
    },
  };

  // 1. Test Supabase Auth API
  if (supabaseUrl && supabaseAnonKey) {
    try {
      const authRes = await fetch(`${supabaseUrl}/auth/v1/settings`, {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
      });

      if (authRes.ok) {
        results.auth.status = "connected";
        results.auth.details = "Supabase Auth API active and accepting credentials";
      } else {
        results.auth.status = "error";
        results.auth.details = `Supabase responded with HTTP ${authRes.status}`;
      }
    } catch (authErr) {
      results.auth.status = "error";
      results.auth.details = authErr instanceof Error ? authErr.message : "Fetch failed";
    }
  }

  // 2. Test Prisma PostgreSQL Database
  try {
    const userCount = await prisma.user.count();
    const txCount = await prisma.transaction.count();
    const profileCount = await prisma.financialProfile.count();

    results.database.status = "connected";
    results.database.tables = {
      users: userCount,
      transactions: txCount,
      financialProfiles: profileCount,
    };
  } catch (dbErr) {
    results.database.status = "disconnected";
    results.database.error = dbErr instanceof Error ? dbErr.message.split("\n")[0] : String(dbErr);

    const isLocalhost = databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1");
    if (isLocalhost) {
      results.database.instruction =
        "DATABASE_URL in .env is currently pointing to localhost:5432. To connect to your Supabase PostgreSQL cloud database, copy your connection URI with password from Supabase Dashboard -> Project Settings -> Database -> Connection String.";
    } else {
      results.database.instruction =
        "Verify your database password and network pooler settings in DATABASE_URL.";
    }
  }

  // Aggregate health status
  if (results.auth.status === "connected" && results.database.status === "connected") {
    results.status = "healthy";
  } else if (results.auth.status === "connected" || results.database.status === "connected") {
    results.status = "partial";
  } else {
    results.status = "error";
  }

  return NextResponse.json(results);
}
