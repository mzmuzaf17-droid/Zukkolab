import { NextResponse } from "next/server";
import { askAssistant } from "@/lib/ai";
import { apiError, fieldErrors, localeFrom } from "@/lib/api";
import { aiChatSchema } from "@/lib/schemas/lead";

// POST /api/ai/chat — { sessionId, message, locale } → { text, cta }.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const locale = localeFrom(body?.locale);
  const parsed = aiChatSchema.safeParse(body);
  if (!parsed.success) return apiError("VALIDATION_ERROR", locale, { fields: fieldErrors(parsed.error) });

  try {
    const reply = await askAssistant({ ...parsed.data, channel: "web" });
    if ("rateLimited" in reply) return apiError("RATE_LIMITED", locale);
    return NextResponse.json(reply, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("POST /api/ai/chat", e);
    return apiError("INTERNAL", locale);
  }
}
