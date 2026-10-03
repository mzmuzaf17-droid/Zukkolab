import { z } from "zod";

// Server sirlari faqat server kodida oʻqiladi; NEXT_PUBLIC_* qiymatlar brauzerga ham chiqadi.
const serverSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  TELEGRAM_BOT_TOKEN: z.string().min(1).optional(),
  TELEGRAM_WEBHOOK_SECRET: z.string().min(16).optional(),
  NEXT_PUBLIC_TELEGRAM_BOT_USERNAME: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(16).optional(),
  TEST_TOKEN_SECRET: z.string().min(32).optional(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1).optional(),
  TURNSTILE_SECRET_KEY: z.string().min(1).optional(),
  AI_PROVIDER: z.enum(["faq", "gemini"]).default("faq"),
  GEMINI_API_KEY: z.string().min(1).optional(),
  DEMO_MODE: z.enum(["true", "false"]).default("true"),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | undefined;

export function serverEnv(): ServerEnv {
  cached ??= serverSchema.parse(process.env);
  return cached;
}

export function isDemoMode(): boolean {
  return process.env.DEMO_MODE !== "false";
}
