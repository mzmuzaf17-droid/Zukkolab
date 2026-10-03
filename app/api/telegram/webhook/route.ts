import { timingSafeEqual } from "node:crypto";
import { webhookCallback } from "grammy";
import { createBot } from "@/lib/telegram/bot";

// Demo zanjiri (30 + 30 + 30 s) javobdan keyin after() ichida ishlaydi.
export const maxDuration = 120;

let handler: ((req: Request) => Promise<Response>) | null = null;

// POST /api/telegram/webhook — X-Telegram-Bot-Api-Secret-Token tekshiriladi; mos kelmasa 401 (7-bo'lim).
export async function POST(req: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!token || !secret) return new Response("Bot is not configured", { status: 503 });
  // Secret'ni darhol tekshiramiz: begona so'rov bot.init() (getMe) va bazaga yetib bormasin.
  const given = Buffer.from(req.headers.get("x-telegram-bot-api-secret-token") ?? "");
  const expected = Buffer.from(secret);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return new Response("Unauthorized", { status: 401 });
  }
  handler ??= webhookCallback(createBot(token), "std/http", {
    secretToken: secret,
    timeoutMilliseconds: 9000,
  });
  return handler(req);
}
