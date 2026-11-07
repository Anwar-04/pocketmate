/**
 * Safely normalizes and validates Supabase environment variables.
 * Handles edge cases like quotes pasted from .env files, accidental whitespace,
 * missing protocols, or template placeholders.
 */
export function getSupabaseConfig() {
  const fallbackUrl = "https://bpmrvttzaiqzspmolujg.supabase.co";
  const fallbackAnonKey = "sb_publishable_4Ugkm_ForpS-BWUcMeV8lg_rr2k9sXQ";

  let rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  // Strip surrounding quotes (double or single)
  rawUrl = rawUrl.replace(/^["']+|["']+$/g, "").trim();

  // If user pasted KEY=VALUE into the Vercel value field
  if (rawUrl.includes("=")) {
    rawUrl = rawUrl.split("=")[1].trim().replace(/^["']+|["']+$/g, "").trim();
  }

  // Prepend https:// if protocol is missing
  if (rawUrl && !rawUrl.startsWith("http://") && !rawUrl.startsWith("https://")) {
    rawUrl = "https://" + rawUrl;
  }

  // Remove trailing slashes
  rawUrl = rawUrl.replace(/\/+$/, "");

  // If invalid, placeholder, or empty, fallback
  let supabaseUrl = fallbackUrl;
  if (rawUrl && !rawUrl.includes("[") && !rawUrl.includes("]") && rawUrl.includes("supabase.co")) {
    try {
      new URL(rawUrl);
      supabaseUrl = rawUrl;
    } catch {
      supabaseUrl = fallbackUrl;
    }
  }

  let rawKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
  rawKey = rawKey.replace(/^["']+|["']+$/g, "").trim();
  if (rawKey.includes("=")) {
    rawKey = rawKey.split("=")[1].trim().replace(/^["']+|["']+$/g, "").trim();
  }

  let supabaseAnonKey = fallbackAnonKey;
  if (rawKey && rawKey.length > 20 && !rawKey.includes("...") && !rawKey.includes("[")) {
    supabaseAnonKey = rawKey;
  }

  return { supabaseUrl, supabaseAnonKey };
}
