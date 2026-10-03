import { NextResponse } from "next/server";
import { apiError, localeFrom } from "@/lib/api";
import { getAvailableSlots } from "@/lib/data/leads";

export const dynamic = "force-dynamic";

// GET /api/slots?direction=&branch= — keyingi 14 kunlik bo'sh slotlar (har so'rovda yangi).
export async function GET(req: Request) {
  const url = new URL(req.url);
  const direction = url.searchParams.get("direction") ?? "";
  const branch = url.searchParams.get("branch") ?? "";
  if (!direction || !branch) return apiError("VALIDATION_ERROR", localeFrom(url.searchParams.get("locale")));
  const slots = await getAvailableSlots(direction, branch);
  return NextResponse.json({ slots }, { headers: { "Cache-Control": "no-store" } });
}
