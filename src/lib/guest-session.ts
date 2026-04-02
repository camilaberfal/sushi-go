import { User } from "@supabase/supabase-js";

import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export async function ensureGuestUser(): Promise<{ user: User | null; errorMessage: string | null }> {
  const supabase = getSupabaseBrowserClient();

  const current = await supabase.auth.getUser();
  if (current.data.user) {
    return { user: current.data.user, errorMessage: null };
  }

  const anon = await supabase.auth.signInAnonymously();
  if (anon.error || !anon.data.user) {
    return {
      user: null,
      errorMessage:
        "No se pudo iniciar una sesion de invitado. Activa Anonymous Auth en Supabase o configura otro metodo de login.",
    };
  }

  return { user: anon.data.user, errorMessage: null };
}