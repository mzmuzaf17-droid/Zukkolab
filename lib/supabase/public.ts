import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Ochiq kontent uchun: sessiyasiz anon klient (RLS: faqat faol yozuvlar). Statik/ISR sahifalarda ishlaydi.
let client: ReturnType<typeof createClient<Database>> | undefined;

export function supabasePublic() {
  client ??= createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  return client;
}
