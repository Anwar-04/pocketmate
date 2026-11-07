import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "./lib/auth/supabase-config";

const PROTECTED_ROUTES = [
  "/dashboard",
  "/transactions",
  "/insights",
  "/coach",
  "/onboarding",
];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const { pathname } = request.nextUrl;
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  const userSessionValue = request.cookies.get("spendwise_session")?.value;
  const hasUserSession = Boolean(
    userSessionValue &&
    userSessionValue !== "active" &&
    !userSessionValue.startsWith("demo-")
  );

  const hasAuthTokenCookie = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));

  let hasSupabaseUser = false;

  // If no spendwise_session exists, verify via Supabase Auth
  if (!hasUserSession && hasAuthTokenCookie) {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

    try {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
            cookiesToSet.forEach(({ name, value }) => {
              request.cookies.set(name, value);
            });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      });

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        hasSupabaseUser = true;
        // Populate spendwise_session so subsequent page requests and API calls authenticate instantly
        response.cookies.set("spendwise_session", user.id, {
          path: "/",
          httpOnly: true,
          maxAge: 60 * 60 * 24 * 7,
          sameSite: "lax",
        });
      }
    } catch {
      // Supabase verification failed
    }
  }

  // User is ONLY authenticated if spendwise_session is active or Supabase confirmed the user
  const isAuthenticated = Boolean(hasUserSession || hasSupabaseUser);

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.delete("redirect");
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/transactions/:path*",
    "/insights/:path*",
    "/coach/:path*",
    "/onboarding/:path*",
  ],
};
