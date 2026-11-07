import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { invalidateCache } from "@/lib/cache/memoryCache";
import { getSupabaseConfig } from "@/lib/auth/supabase-config";

const LoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email: rawEmail, password } = LoginSchema.parse(body);
    const email = rawEmail.trim().toLowerCase();

    const cookieStore = cookies();
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    const cookiesToSetOnResponse: Array<{ name: string; value: string; options?: CookieOptions }> = [];

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookiesToSetOnResponse.push({ name, value, options });
          try {
            cookieStore.set({ name, value, ...options });
          } catch {}
        },
        remove(name: string, options: CookieOptions) {
          cookiesToSetOnResponse.push({ name, value: "", options: { ...options, maxAge: 0 } });
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {}
        },
      },
    });

    let { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // If email is not confirmed, auto-confirm it in PostgreSQL and retry sign-in
    if (
      error &&
      (error.message.includes("Email not confirmed") ||
        (error as { code?: string }).code === "email_not_confirmed")
    ) {
      try {
        await prisma.$executeRawUnsafe(
          `UPDATE auth.users SET email_confirmed_at = NOW() WHERE LOWER(email) = LOWER($1)`,
          email
        );

        const retryResult = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        data = retryResult.data;
        error = retryResult.error;
      } catch (confirmErr) {
        console.error("Auto-confirmation attempt failed:", confirmErr);
      }
    }

    if (error || !data.user) {
      const errMsg = error?.message?.toLowerCase() || "";
      if (errMsg.includes("invalid login credentials") || errMsg.includes("invalid credentials")) {
        return NextResponse.json(
          {
            success: false,
            error: "Incorrect password. If you forgot your password, click 'Sign up' to set a new password.",
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { success: false, error: error?.message || "Invalid email or password" },
        { status: 400 }
      );
    }

    const userId = data.user.id;
    const defaultName = (data.user.user_metadata?.name as string) || email.split("@")[0];

    // Ensure user exists in Prisma database
    let dbUser;
    try {
      dbUser = await prisma.user.upsert({
        where: { id: userId },
        update: { email },
        create: {
          id: userId,
          email,
          name: defaultName,
        },
      });
    } catch {
      dbUser = { id: userId, email, name: defaultName };
    }

    // Determine target redirect
    const existingProfile = await prisma.financialProfile.findUnique({
      where: { userId },
    });
    const hasProfile = Boolean(existingProfile);

    // Set response cookies
    const isHttps =
      request.headers.get("x-forwarded-proto") === "https" ||
      request.url.startsWith("https");

    const response = NextResponse.json({
      success: true,
      message: "Signed in successfully",
      redirect: hasProfile ? "/dashboard" : "/onboarding",
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name || defaultName,
      },
    });

    response.cookies.set("spendwise_session", dbUser.id, {
      path: "/",
      httpOnly: true,
      secure: isHttps,
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });

    response.cookies.delete("spendwise_demo_session");
    response.cookies.set("spendwise_demo_session", "", { path: "/", maxAge: 0 });

    cookiesToSetOnResponse.forEach(({ name, value, options }) => {
      response.cookies.set({ name, value, ...options });
    });

    invalidateCache(`dashboard:${userId}`);

    return response;
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: err.errors[0]?.message || "Validation error" },
        { status: 400 }
      );
    }

    const msg = err instanceof Error ? err.message : "Authentication error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
