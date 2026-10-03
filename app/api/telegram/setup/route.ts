import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { setupTelegram } from "@/lib/telegram/setup";

export const dynamic = "force-dynamic";

// GET /api/telegram/setup?key=<CRON_SECRET> — webhook'ni brauzerdan bir marta o'rnatish uchun
// (lokal muhitsiz). Kalit CRON_SECRET bilan solishtiriladi; mos kelmasa 401.
export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key") ?? "";
  const cron = process.env.CRON_SECRET ?? "";
  const a = Buffer.from(key);
  const b = Buffer.from(cron);
  if (!cron || a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin).replace(/\/$/, "");
  if (!token || !secret) {
    return NextResponse.json(
      { ok: false, error: "TELEGRAM_BOT_TOKEN / TELEGRAM_WEBHOOK_SECRET yo'q" },
      { status: 503 },
    );
  }
  try {
    return NextResponse.json({ ok: true, ...(await setupTelegram(token, secret, site)) });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 502 },
    );
  }
}
