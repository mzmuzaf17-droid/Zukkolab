"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

// Brauzer uchun: faqat anon kalit (RLS bilan) — panel Realtime va login uchun.
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
