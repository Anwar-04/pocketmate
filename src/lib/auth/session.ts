import { cookies } from "next/headers";
import { createServerSupabaseClient } from "./supabase-server";
import { prisma } from "@/lib/db/prisma";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

/**
 * Parses and extracts authenticated user information directly from Supabase auth cookies.
 * Handles single-cookie, chunked cookies (.0, .1), and base64-prefixed formats.
 */
function extractUserFromSupabaseCookies(cookieStore: ReturnType<typeof cookies>): SessionUser | null {
  try {
    const allCookies = cookieStore.getAll();
    const tokenCookies = allCookies
      .filter((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"))
      .sort((a, b) => {
        const idxA = a.name.includes(".") ? parseInt(a.name.split(".").pop() || "0", 10) : 0;
        const idxB = b.name.includes(".") ? parseInt(b.name.split(".").pop() || "0", 10) : 0;
        return idxA - idxB;
      });

    if (tokenCookies.length === 0) return null;

    let rawValue = tokenCookies.map((c) => c.value).join("");
    if (rawValue.includes("%")) {
      try {
        rawValue = decodeURIComponent(rawValue);
      } catch {}
    }
    if (rawValue.startsWith("base64-")) {
      try {
        rawValue = Buffer.from(rawValue.slice(7), "base64").toString("utf-8");
      } catch {}
    }

    const sessionData = JSON.parse(rawValue);
    const accessToken: string | undefined = Array.isArray(sessionData)
      ? sessionData[0]
      : (sessionData?.access_token || sessionData);

    if (!accessToken || typeof accessToken !== "string") return null;

    const parts = accessToken.split(".");
    if (parts.length !== 3) return null;

    const payloadJson = Buffer.from(parts[1], "base64").toString("utf-8");
    const payload = JSON.parse(payloadJson);

    if (payload && payload.sub) {
      const userName =
        payload.user_metadata?.full_name ||
        payload.user_metadata?.name ||
        payload.email?.split("@")[0] ||
        "User";

      return {
        id: payload.sub,
        email: payload.email || "",
        name: userName,
      };
    }
  } catch {
    // Fail silently to next auth method
  }

  return null;
}

/**
 * Retrieves the currently authenticated user from either Supabase Auth,
 * decoded session JWT, or PostgreSQL session.
 * Returns null if no authentic user session is present.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get("spendwise_session") || cookieStore.get("spendwise_demo_session");

  // 1. If a valid user session cookie exists, resolve the user directly from PostgreSQL
  if (
    sessionCookie?.value &&
    sessionCookie.value !== "active" &&
    !sessionCookie.value.startsWith("demo-")
  ) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: sessionCookie.value },
      });
      if (dbUser) {
        return {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name || dbUser.email.split("@")[0] || "User",
        };
      }
    } catch (dbErr) {
      console.warn("DB user lookup warning in session:", dbErr);
    }
  }

  // 2. High-speed local token extraction from Supabase cookies (instant, zero network latency)
  const tokenUser = extractUserFromSupabaseCookies(cookieStore);
  if (tokenUser) {
    try {
      const dbUser = await prisma.user.upsert({
        where: { id: tokenUser.id },
        update: { email: tokenUser.email, name: tokenUser.name },
        create: {
          id: tokenUser.id,
          email: tokenUser.email,
          name: tokenUser.name,
        },
      });

      // Best effort to set spendwise_session cookie for ultra-fast subsequent lookups
      try {
        cookieStore.set("spendwise_session", dbUser.id, {
          path: "/",
          httpOnly: true,
          maxAge: 60 * 60 * 24 * 7,
          sameSite: "lax",
        });
      } catch {}

      return {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name || tokenUser.name,
      };
    } catch {
      return tokenUser;
    }
  }

  // 3. Fallback to live Supabase Auth remote verification
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    const userName =
      (user.user_metadata?.full_name as string) ||
      (user.user_metadata?.name as string) ||
      user.email?.split("@")[0] ||
      "User";

    let dbUser: { id: string; email: string; name: string | null } | null = null;
    try {
      dbUser = await prisma.user.upsert({
        where: { id: user.id },
        update: { email: user.email || "", name: userName },
        create: {
          id: user.id,
          email: user.email || "",
          name: userName,
        },
      });
    } catch (syncErr) {
      console.warn("Database user provisioning warning in session:", syncErr);
    }

    try {
      cookieStore.set("spendwise_session", user.id, {
        path: "/",
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7,
        sameSite: "lax",
      });
    } catch {}

    return {
      id: user.id,
      email: user.email || "",
      name: dbUser?.name || userName,
    };
  } catch {
    return null;
  }
}
