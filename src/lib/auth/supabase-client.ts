import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./supabase-config";

/**
 * Creates a browser-side Supabase client for authentication and public operations.
 */
export function createClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
