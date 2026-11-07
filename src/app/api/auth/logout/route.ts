import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/auth/supabase-server";

export async function POST() {
  const cookieStore = cookies();
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });

  // Explicitly clear spendwise session cookies on response
  response.cookies.delete("spendwise_session");
  response.cookies.delete("spendwise_demo_session");
  response.cookies.set("spendwise_session", "", { path: "/", maxAge: 0 });
  response.cookies.set("spendwise_demo_session", "", { path: "/", maxAge: 0 });

  try {
    cookieStore.delete("spendwise_session");
    cookieStore.delete("spendwise_demo_session");
  } catch {}

  // Explicitly clear all Supabase auth cookies on response
  const allCookies = cookieStore.getAll();
  for (const c of allCookies) {
    if (c.name.startsWith("sb-") || c.name.includes("spendwise") || c.name.includes("auth-token")) {
      response.cookies.delete(c.name);
      response.cookies.set(c.name, "", { path: "/", maxAge: 0 });
      try {
        cookieStore.delete(c.name);
      } catch {}
    }
  }

  // Clear Supabase session on server
  try {
    const supabase = createServerSupabaseClient();
    await supabase.auth.signOut();
  } catch {
    // Ignore signOut network hiccups
  }

  return response;
}
