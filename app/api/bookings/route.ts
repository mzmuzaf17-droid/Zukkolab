import { cookies } from "next/headers";
import { after, NextResponse } from "next/server";
import { apiError, clientIp, fieldErrors, localeFrom } from "@/lib/api";
import { createBooking } from "@/lib/data/leads";
import { parseSourceCookie, SOURCE_COOKIE } from "@/lib/leads/source";
import { notifyNewLead, runDemoChain, sendBoundMessage } from "@/lib/notify";
import { validateInitData } from "@/lib/telegram/init-data";
import { bookingSchema } from "@/lib/schemas/lead";
import { verifyTurnstile } from "@/lib/turnstile";

export const maxDuration = 120;

// POST /api/bookings — lid topiladi yoki yaratiladi → book_trial() → guruhga xabar → { bookingId }.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const locale = localeFrom(body?.locale);
  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) return apiError("VALIDATION_ERROR", locale, { fields: fieldErrors(parsed.error) });
  if (!(await verifyTurnstile(parsed.data.turnstileToken, clientIp(req))))
    return apiError("CAPTCHA_FAILED", locale);

  try {
    const source = parseSourceCookie((await cookies()).get(SOURCE_COOKIE)?.value);
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const tgUser = parsed.data.tgInitData && token ? validateInitData(parsed.data.tgInitData, token) : null;
    const result = await createBooking({ ...parsed.data, source, tgUser });
    if (!result.ok) return apiError(result.code, locale, { data: { startsAt: result.startsAt } });
    after(async () => {
      await notifyNewLead(result.leadId);
      // Mini App'dan yozilgan bo'lsa — chatga tasdiq; demo bronda tezlashtirilgan eslatmalar zanjiri.
      if (result.chatBound) {
        await sendBoundMessage(result.bookingId);
        if (result.demo) await runDemoChain();
      }
    });
    return NextResponse.json({ bookingId: result.bookingId }, { status: 201 });
  } catch (e) {
    console.error("POST /api/bookings", e);
    return apiError("INTERNAL", locale);
  }
}
