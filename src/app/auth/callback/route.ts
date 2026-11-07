import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { invalidateCache } from "@/lib/cache/memoryCache";
import { getSupabaseConfig } from "@/lib/auth/supabase-config";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  const isHttps = request.headers.get("x-forwarded-proto") === "https" || request.url.startsWith("https");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host");
  const redirectBase = host
    ? `${isHttps ? "https" : "http"}://${host}`
    : origin;

  if (code) {
    const cookieStore = cookies();
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

    const cookiesToSetOnResponse: { name: string; value: string; options: CookieOptions }[] = [];

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookiesToSetOnResponse.push({ name, value, options: options || {} });
            try {
              cookieStore.set(name, value, options);
            } catch {}
          });
        },
      },
    });

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      const user = data.user;
      const userName =
        (user.user_metadata?.full_name as string) ||
        (user.user_metadata?.name as string) ||
        user.email?.split("@")[0] ||
        "User";

      // Sync user to Prisma
      try {
        await prisma.user.upsert({
          where: { id: user.id },
          update: { email: user.email || "", name: userName },
          create: {
            id: user.id,
            email: user.email || "",
            name: userName,
          },
        });
      } catch (dbErr) {
        console.warn("OAuth DB sync warning:", dbErr);
      }

      // Check whether user has configured their real financial baseline
      let hasProfile = false;
      try {
        const existingProfile = await prisma.financialProfile.findUnique({
          where: { userId: user.id },
        });
        hasProfile = Boolean(existingProfile);
      } catch {
        // Continue
      }

      const targetPath = hasProfile ? next : "/onboarding";
      const redirectResponse = NextResponse.redirect(`${redirectBase}${targetPath}`);

      // Apply all exchanged Supabase auth cookies directly to the HTTP response
      for (const { name, value, options } of cookiesToSetOnResponse) {
        redirectResponse.cookies.set({ name, value, ...options });
      }

      // Set user session cookie on response
      redirectResponse.cookies.set("spendwise_session", user.id, {
        path: "/",
        httpOnly: true,
        secure: isHttps,
        maxAge: 60 * 60 * 24 * 7,
        sameSite: "lax",
      });

      // Clear legacy demo session cookie
      redirectResponse.cookies.delete("spendwise_demo_session");
      redirectResponse.cookies.set("spendwise_demo_session", "", { path: "/", maxAge: 0 });

      invalidateCache(`dashboard:${user.id}`);

      return redirectResponse;
    }
  }

  return NextResponse.redirect(`${redirectBase}/login?error=Could not complete OAuth authentication`);
}
