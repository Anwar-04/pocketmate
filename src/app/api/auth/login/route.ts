import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { invalidateCache } from "@/lib/cache/memoryCache";

const LoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = LoginSchema.parse(body);

    const cookieStore = cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://bpmrvttzaiqzspmolujg.supabase.co";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_4Ugkm_ForpS-BWUcMeV8lg_rr2k9sXQ";

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    });

    let { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // If email is not confirmed, auto-confirm it in PostgreSQL and retry sign-in
    if (error && (error.message.includes("Email not confirmed") || (error as { code?: string }).code === "email_not_confirmed")) {
      try {
        await prisma.$executeRawUnsafe(
          `UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = $1`,
          email.toLowerCase().trim()
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
      return NextResponse.json(
        { success: false, error: error?.message || "Invalid email or password" },
        { status: 400 }
      );
    }

    // Ensure user exists in database
    let hasProfile = false;
    try {
      await prisma.user.upsert({
        where: { id: data.user.id },
        update: { email: data.user.email || email },
        create: {
          id: data.user.id,
          email: data.user.email || email,
          name: (data.user.user_metadata?.name as string) || email.split("@")[0],
        },
      });

      const existingProfile = await prisma.financialProfile.findUnique({
        where: { userId: data.user.id },
      });
      hasProfile = Boolean(existingProfile);
    } catch (syncErr) {
      console.warn("User DB sync warning:", syncErr);
    }

    // Set session cookie
    const isHttps = request.headers.get("x-forwarded-proto") === "https" || request.url.startsWith("https");
    const response = NextResponse.json({
      success: true,
      message: "Signed in successfully",
      redirect: hasProfile ? "/dashboard" : "/onboarding",
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || email.split("@")[0],
      },
    });

    response.cookies.set("spendwise_session", data.user.id, {
      path: "/",
      httpOnly: true,
      secure: isHttps,
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });
    response.cookies.delete("spendwise_demo_session");
    response.cookies.set("spendwise_demo_session", "", { path: "/", maxAge: 0 });

    cookieStore.set("spendwise_session", data.user.id, {
      path: "/",
      httpOnly: true,
      secure: isHttps,
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });

    invalidateCache(`dashboard:${data.user.id}`);

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
