import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

// Backward-compatible export while app migrates to browser/server/middleware clients.
export const supabase = getSupabaseBrowserClient();