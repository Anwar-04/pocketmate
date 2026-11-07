import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a browser-side Supabase client for authentication and public operations.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://bpmrvttzaiqzspmolujg.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_4Ugkm_ForpS-BWUcMeV8lg_rr2k9sXQ";

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
