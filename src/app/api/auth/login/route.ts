import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { invalidateCache } from "@/lib/cache/memoryCache";
import { getSupabaseConfig } from "@/lib/auth/supabase-config";

const AuthSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email: rawEmail, password } = AuthSchema.parse(body);
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

    // 1. Check if user already exists in Prisma database
    let existingUser = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });

    let userId: string | undefined;
    let isNewUser = false;

    if (existingUser) {
      // --- FLOW A: USER EXISTS -> SIGN IN ---
      userId = existingUser.id;
      let signInResult = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // If Supabase returned "Email not confirmed", try auto-confirming in PostgreSQL and retry
      if (
        signInResult.error &&
        (signInResult.error.message.includes("Email not confirmed") ||
          (signInResult.error as { code?: string }).code === "email_not_confirmed")
      ) {
        try {
          await prisma.$executeRawUnsafe(
            `UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = $1`,
            email
          );
          signInResult = await supabase.auth.signInWithPassword({ email, password });
        } catch {}
      }

      if (signInResult.error) {
        const errMsg = signInResult.error.message.toLowerCase();
        if (errMsg.includes("invalid login credentials") || errMsg.includes("invalid credentials")) {
          return NextResponse.json(
            {
              success: false,
              error: "An account with this email already exists, but the password was incorrect. Please check your password and try again.",
            },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { success: false, error: signInResult.error.message },
          { status: 400 }
        );
      }

      if (signInResult.data?.user?.id) {
        userId = signInResult.data.user.id;
      }
    } else {
      // --- FLOW B: USER DOES NOT EXIST -> SIGN UP ---
      const defaultName = email.split("@")[0];
      const signUpResult = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name: defaultName },
        },
      });

      if (signUpResult.error) {
        // If Supabase says user already exists in auth.users (even if missing from Prisma User table)
        const errMsg = signUpResult.error.message.toLowerCase();
        if (errMsg.includes("already registered") || errMsg.includes("user already exists")) {
          // Attempt sign in
          const retrySignIn = await supabase.auth.signInWithPassword({ email, password });
          if (retrySignIn.error) {
            return NextResponse.json(
              {
                success: false,
                error: "An account with this email exists. Please enter the correct password.",
              },
              { status: 400 }
            );
          }
          if (retrySignIn.data?.user) {
            userId = retrySignIn.data.user.id;
          }
        } else {
          return NextResponse.json(
            { success: false, error: signUpResult.error.message },
            { status: 400 }
          );
        }
      } else if (signUpResult.data.user) {
        userId = signUpResult.data.user.id;
        isNewUser = true;

        // Auto-confirm in PostgreSQL
        try {
          await prisma.$executeRawUnsafe(
            `UPDATE auth.users SET email_confirmed_at = NOW() WHERE id = $1`,
            userId
          );
        } catch {}

        // Immediate sign in to establish tokens
        await supabase.auth.signInWithPassword({ email, password });
      }
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Authentication failed. Please try again." },
        { status: 500 }
      );
    }

    // 2. Ensure Prisma User record exists and matches
    const defaultName = email.split("@")[0];
    const dbUser = await prisma.user.upsert({
      where: { id: userId },
      update: { email },
      create: {
        id: userId,
        email,
        name: defaultName,
      },
    });

    // 3. Determine redirect target: onboarding if no financial profile, else dashboard
    const profile = await prisma.financialProfile.findUnique({
      where: { userId },
    });
    const hasProfile = Boolean(profile);
    const redirect = hasProfile ? "/dashboard" : "/onboarding";

    // 4. Set session cookie on HTTP response
    const isHttps =
      request.headers.get("x-forwarded-proto") === "https" ||
      request.url.startsWith("https");

    const response = NextResponse.json({
      success: true,
      message: isNewUser ? "Account created successfully" : "Signed in successfully",
      redirect,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name || defaultName,
      },
    });

    // Write spendwise_session cookie to response
    response.cookies.set("spendwise_session", dbUser.id, {
      path: "/",
      httpOnly: true,
      secure: isHttps,
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });

    // Clear any stale demo cookies
    response.cookies.delete("spendwise_demo_session");
    response.cookies.set("spendwise_demo_session", "", { path: "/", maxAge: 0 });

    // Forward Supabase auth cookies onto response
    cookiesToSetOnResponse.forEach(({ name, value, options }) => {
      response.cookies.set({ name, value, ...options });
    });

    invalidateCache(`dashboard:${dbUser.id}`);

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
