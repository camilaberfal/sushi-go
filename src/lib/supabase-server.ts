import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type CreateServerClientOptions = {
  accessToken?: string;
};

function getPublicEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return { supabaseUrl, supabaseAnonKey };
}

export function createSupabaseServerClient(options: CreateServerClientOptions = {}): SupabaseClient {
  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: options.accessToken
        ? {
            Authorization: `Bearer ${options.accessToken}`,
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
