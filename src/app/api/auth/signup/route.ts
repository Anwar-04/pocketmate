import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { invalidateCache } from "@/lib/cache/memoryCache";
import { getSupabaseConfig } from "@/lib/auth/supabase-config";

const SignupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required").max(100),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = SignupSchema.parse(body);

    const cookieStore = cookies();
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

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

    let userId: string | undefined;

    // 1. Sign up user via Supabase Auth
    const signUpResult = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (signUpResult.error) {
      // If Supabase free tier rate limit is exceeded for outgoing emails, provision directly into auth.users!
      const errorMsg = signUpResult.error.message.toLowerCase();
      if (errorMsg.includes("rate limit") || errorMsg.includes("email rate limit")) {
        try {
          const insertRes = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
            `
            INSERT INTO auth.users (
              instance_id,
              id,
              aud,
              role,
              email,
              encrypted_password,
              email_confirmed_at,
              confirmation_token,
              recovery_token,
              email_change_token_new,
              email_change,
              phone_change,
              phone_change_token,
              reauthentication_token,
              email_change_token_current,
              email_change_confirm_status,
              is_sso_user,
              is_anonymous,
              raw_app_meta_data,
              raw_user_meta_data,
              created_at,
              updated_at
            )
            VALUES (
              '00000000-0000-0000-0000-000000000000',
              gen_random_uuid(),
              'authenticated',
              'authenticated',
              $1,
              crypt($2, gen_salt('bf', 10)),
              NOW(),
              '',
              '',
              '',
              '',
              '',
              '',
              '',
              '',
              0,
              false,
              false,
              '{"provider":"email","providers":["email"]}',
              json_build_object('sub', gen_random_uuid()::text, 'email', $1::text, 'email_verified', true, 'name', $3::text),
              NOW(),
              NOW()
            )
            RETURNING id;
          `,
            email,
            password,
            name
          );

          userId = insertRes[0]?.id;

          if (userId) {
            await prisma.$executeRawUnsafe(
              `
              INSERT INTO auth.identities (
                id,
                user_id,
                provider_id,
                identity_data,
                provider,
                last_sign_in_at,
                created_at,
                updated_at
              )
              VALUES (
                gen_random_uuid(),
                $1::uuid,
                $1,
                json_build_object('sub', $1::text, 'email', $2::text, 'email_verified', true, 'name', $3::text),
                'email',
                NOW(),
                NOW(),
                NOW()
              )
              ON CONFLICT DO NOTHING;
            `,
              userId,
              email,
              name
            );
          }
        } catch (dbInsertErr) {
          console.error("Direct fallback provision failed:", dbInsertErr);
          return NextResponse.json(
            { success: false, error: signUpResult.error.message },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { success: false, error: signUpResult.error.message },
          { status: 400 }
        );
      }
    } else {
      userId = signUpResult.data.user?.id;
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Failed to create user account" },
        { status: 500 }
      );
    }

    // 2. Auto-confirm in PostgreSQL so user is immediately active without email delay blocks
    try {
      await prisma.$executeRawUnsafe(
        `UPDATE auth.users SET email_confirmed_at = NOW() WHERE id = $1`,
        userId
      );
    } catch (confirmErr) {
      console.warn("Auto-confirm error:", confirmErr);
    }

    // 3. Immediately sign in to establish active session tokens in cookies
    const signInResult = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // 4. Ensure public.users and public.financial_profiles records exist
    try {
      await prisma.user.upsert({
        where: { id: userId },
        update: { name, email },
        create: {
          id: userId,
          email,
          name,
        },
      });
    } catch (syncErr) {
      console.warn("Database user provisioning warning:", syncErr);
    }

    // 5. Set session cookie on response
    const isHttps = request.headers.get("x-forwarded-proto") === "https" || request.url.startsWith("https");
    const response = NextResponse.json({
      success: true,
      message: "Account created successfully",
      redirect: "/onboarding",
      user: {
        id: userId,
        email,
        name,
      },
    });

    response.cookies.set("spendwise_session", userId, {
      path: "/",
      httpOnly: true,
      secure: isHttps,
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });
    response.cookies.delete("spendwise_demo_session");
    response.cookies.set("spendwise_demo_session", "", { path: "/", maxAge: 0 });

    cookieStore.set("spendwise_session", userId, {
      path: "/",
      httpOnly: true,
      secure: isHttps,
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
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

    const msg = err instanceof Error ? err.message : "Registration error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
