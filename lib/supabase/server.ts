import { createClient, SupabaseClient } from "@supabase/supabase-js";

let serverClient: SupabaseClient | null | undefined;

export function getSupabaseServerClient() {
  if (serverClient !== undefined) {
    return serverClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    serverClient = null;
    return serverClient;
  }

  serverClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  return serverClient;
}
