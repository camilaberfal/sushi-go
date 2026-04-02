import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type MiddlewareLikeRequest = {
  headers?: Headers;
};

function getPublicEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return { supabaseUrl, supabaseAnonKey };
}

export function createSupabaseMiddlewareClient(request: MiddlewareLikeRequest): SupabaseClient {
  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();
  const authHeader = request.headers?.get("authorization") ?? request.headers?.get("Authorization") ?? undefined;

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: authHeader
        ? {
            Authorization: authHeader,
          }
        : undefined,
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
