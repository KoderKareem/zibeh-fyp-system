import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client. Bypasses RLS entirely — never import this into
 * anything that runs in the browser. Only use it after your own code has
 * already checked that the current request is allowed to do what it's
 * about to do (e.g. generating a signed Storage URL for a document the
 * caller has been confirmed to have access to).
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
