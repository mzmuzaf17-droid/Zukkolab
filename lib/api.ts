import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import type { z } from "zod";
import { isLocale, routing, type Locale } from "@/lib/i18n/routing";

// Xato formati hamma joyda bir xil: { error: { code, message, fields? } }, message — foydalanuvchi tilida (11-bo'lim).
export const ERROR_STATUS = {
  VALIDATION_ERROR: 422,
  CAPTCHA_FAILED: 403,
  SLOT_FULL: 409,
  ALREADY_BOOKED: 409,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  UNAUTHORIZED: 401,
  INTERNAL: 500,
} as const;
export type ErrorCode = keyof typeof ERROR_STATUS;

export function localeFrom(value: unknown): Locale {
  return typeof value === "string" && isLocale(value) ? value : routing.defaultLocale;
}

export async function apiError(
  code: ErrorCode,
  locale: Locale,
  extra?: { fields?: Record<string, string>; data?: unknown },
) {
  const t = await getTranslations({ locale, namespace: "errors" });
  return NextResponse.json(
    { error: { code, message: t(code), ...extra } },
    { status: ERROR_STATUS[code], headers: { "Cache-Control": "no-store" } },
  );
}

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    out[key] ??= issue.message;
  }
  return out;
}

export function clientIp(req: Request): string | null {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip");
}
