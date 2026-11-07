import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
}

export async function POST() {
  return NextResponse.json(
    { success: false, error: "Demo mode is disabled. Please create an account or sign in to test with real data." },
    { status: 403 }
  );
}
