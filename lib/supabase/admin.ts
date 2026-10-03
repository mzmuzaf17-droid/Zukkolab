import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// service_role: RLS'ni chetlab oʻtadi. Faqat Zod va Turnstile tekshiruvidan keyin, faqat serverda.
let admin: ReturnType<typeof createClient<Database>> | undefined;

export function supabaseAdmin() {
  admin ??= createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  return admin;
}
