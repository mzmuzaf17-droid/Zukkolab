import { z } from "zod";
import { normalizeUzPhone } from "@/lib/phone";
import { NAME_MAX, NAME_MIN, NAME_PATTERN } from "./rules";

// Bitta Zod sxema — ham forma, ham API uchun (3-bo'lim). Xabarlar — messages/*.json dagi "validation" kalitlari.
export const phoneSchema = z
  .string()
  .trim()
  .transform((v, ctx) => {
    const phone = normalizeUzPhone(v);
    if (!phone) {
      ctx.addIssue({ code: "custom", message: "phone" });
      return z.NEVER;
    }
    return phone;
  });

export const nameSchema = z
  .string()
  .trim()
  .min(NAME_MIN, "name")
  .max(NAME_MAX, "name")
  .regex(NAME_PATTERN, "name");

const locale = z.enum(["uz", "ru", "en"]);

export const leadSchema = z.object({
  fullName: nameSchema,
  phone: phoneSchema,
  directionSlug: z.string().max(40).optional(),
  courseSlug: z.string().max(80).optional(),
  locale,
  consent: z.literal(true, "consent"),
  turnstileToken: z.string().max(4096).optional(),
  // Honeypot: odam ko'rmaydigan maydon; to'ldirilgan bo'lsa — bot.
  website: z.string().max(0).optional(),
});
export type LeadInput = z.input<typeof leadSchema>;

export const bookingSchema = z.object({
  slotId: z.uuid(),
  fullName: nameSchema,
  phone: phoneSchema,
  studentName: nameSchema.optional().or(z.literal("").transform(() => undefined)),
  studentAge: z.coerce.number().int().min(3, "age").max(80, "age").optional(),
  courseSlug: z.string().max(80).optional(),
  testAttemptId: z.uuid().optional(),
  demo: z.boolean().optional(),
  // Mini App ichida: Telegram imzolagan initData — bron chatga avtomatik bog'lanadi.
  tgInitData: z.string().max(4096).optional(),
  locale,
  consent: z.literal(true, "consent"),
  turnstileToken: z.string().max(4096).optional(),
  website: z.string().max(0).optional(),
});
export type BookingInput = z.input<typeof bookingSchema>;

export const testSubmitSchema = z.object({
  attemptToken: z.string().min(10).max(4096),
  answers: z.record(z.string(), z.string().max(4)),
  locale,
});

// POST /api/ai/chat (11-bo'lim).
export const aiChatSchema = z.object({
  sessionId: z.uuid(),
  message: z.string().trim().min(1).max(500),
  locale,
});
