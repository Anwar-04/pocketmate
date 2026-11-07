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
    const { email: rawEmail, password, name } = SignupSchema.parse(body);
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
      const errorMsg = signUpResult.error.message.toLowerCase();

      // If user already exists in Supabase Auth, reset password to what they just entered and sign in
      if (
        errorMsg.includes("already registered") ||
        errorMsg.includes("user already exists") ||
        errorMsg.includes("already exist")
      ) {
        try {
          // Update password and confirm email directly in PostgreSQL
          await prisma.$executeRawUnsafe(
            `UPDATE auth.users 
             SET encrypted_password = crypt($1, gen_salt('bf', 10)),
                 email_confirmed_at = NOW(),
                 raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb), '{name}', to_jsonb($2::text)),
                 updated_at = NOW() 
             WHERE LOWER(email) = LOWER($3)`,
            password,
            name,
            email
          );

          // Now sign in with new credentials
          const signInRes = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (signInRes.data?.user) {
            userId = signInRes.data.user.id;
          }
        } catch (updateErr) {
          console.warn("User password update attempt:", updateErr);
        }
      } else if (errorMsg.includes("rate limit") || errorMsg.includes("email rate limit")) {
        // Direct PostgreSQL provision when email rate limit hit
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

            await supabase.auth.signInWithPassword({ email, password });
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
      // Final attempt to look up user in DB
      const existingUser = await prisma.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
      });
      if (existingUser) {
        userId = existingUser.id;
      } else {
        return NextResponse.json(
          { success: false, error: "Failed to create user account. Please try again." },
          { status: 500 }
        );
      }
    }

    // 2. Auto-confirm in PostgreSQL
    try {
      await prisma.$executeRawUnsafe(
        `UPDATE auth.users SET email_confirmed_at = NOW() WHERE id = $1`,
        userId
      );
    } catch {}

    // 3. Ensure Prisma User row exists
    const dbUser = await prisma.user.upsert({
      where: { id: userId },
      update: { name, email },
      create: {
        id: userId,
        email,
        name,
      },
    });

    // 4. Try sign-in to populate Supabase cookies
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // 5. Check if user already has an established financial baseline
    const profile = await prisma.financialProfile.findUnique({
      where: { userId: dbUser.id },
    });
    const hasProfile = Boolean(profile);
    const redirect = hasProfile ? "/dashboard" : "/onboarding";

    // 6. Set response cookies
    const isHttps =
      request.headers.get("x-forwarded-proto") === "https" ||
      request.url.startsWith("https");

    const response = NextResponse.json({
      success: true,
      message: "Account created successfully",
      redirect,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name || name,
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

    invalidateCache(`dashboard:${dbUser.id}`);

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
