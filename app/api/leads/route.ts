import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { after } from "next/server";
import { apiError, clientIp, fieldErrors, localeFrom } from "@/lib/api";
import { createLead } from "@/lib/data/leads";
import { parseSourceCookie, SOURCE_COOKIE } from "@/lib/leads/source";
import { notifyNewLead } from "@/lib/notify";
import { leadSchema } from "@/lib/schemas/lead";
import { verifyTurnstile } from "@/lib/turnstile";

// POST /api/leads — qisqa ariza formasi (ism, telefon, yo'nalish, roziliq).
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const locale = localeFrom(body?.locale);
  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) return apiError("VALIDATION_ERROR", locale, { fields: fieldErrors(parsed.error) });
  if (!(await verifyTurnstile(parsed.data.turnstileToken, clientIp(req))))
    return apiError("CAPTCHA_FAILED", locale);

  try {
    const source = parseSourceCookie((await cookies()).get(SOURCE_COOKIE)?.value);
    const { leadId, duplicate } = await createLead({ ...parsed.data, source });
    if (!duplicate) after(() => notifyNewLead(leadId));
    return NextResponse.json({ leadId }, { status: 201 });
  } catch (e) {
    console.error("POST /api/leads", e);
    return apiError("INTERNAL", locale);
  }
}
