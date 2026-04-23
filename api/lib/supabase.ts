import { createClient } from "@supabase/supabase-js";

export function makeSupabase(serviceRole = false) {
  const url = process.env.SUPABASE_URL;
  const key = serviceRole
    ? process.env.SUPABASE_SERVICE_KEY
    : process.env.SUPABASE_ANON_KEY;

  if (!url || !key) throw new Error("Supabase env vars not configured");
  return createClient(url, key);
}
