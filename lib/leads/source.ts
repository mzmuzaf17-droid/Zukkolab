import { z } from "zod";

// FR-SITE-02: birinchi tashrifdagi utm_* va referrer 30 kunlik zk_src cookie'da saqlanadi.
export const SOURCE_COOKIE = "zk_src";
export const SOURCE_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

export const sourceSchema = z.object({
  utm_source: z.string().max(100).optional(),
  utm_medium: z.string().max(100).optional(),
  utm_campaign: z.string().max(200).optional(),
  utm_content: z.string().max(200).optional(),
  referrer: z.string().max(500).optional(),
  ref: z.uuid().optional(),
});
export type SourceInfo = z.infer<typeof sourceSchema>;

export function parseSourceCookie(value: string | undefined): SourceInfo {
  if (!value) return {};
  try {
    const raw = value.startsWith("%7B") ? decodeURIComponent(value) : value;
    const parsed = sourceSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}

// Hisobotdagi normallashgan manba; ad_spend.source bilan bir xil nomlar.
export function normalizeSource(info: SourceInfo): string {
  if (info.ref) return "referral";
  const utm = info.utm_source?.toLowerCase();
  if (utm) {
    if (["instagram", "ig", "insta"].includes(utm)) return "instagram";
    if (["facebook", "fb", "meta"].includes(utm)) return "facebook";
    if (["telegram", "tg"].includes(utm)) return "telegram";
    if (["google", "gads", "adwords"].includes(utm)) return "google";
    if (["yandex", "ya"].includes(utm)) return "yandex";
    return utm.replace(/[^a-z0-9_-]/g, "").slice(0, 40) || "other";
  }
  const host = info.referrer ? safeHost(info.referrer) : "";
  if (host.includes("instagram")) return "instagram";
  if (host.includes("facebook")) return "facebook";
  if (host.includes("t.me") || host.includes("telegram")) return "telegram";
  if (host.includes("google")) return "google";
  if (host.includes("yandex")) return "yandex";
  return host ? "other" : "direct";
}

function safeHost(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}
