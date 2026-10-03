// pnpm bot:set-webhook — Telegram'ga webhook manzili, buyruqlar va menyu tugmasini o'rnatadi.
// Kerak: TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, NEXT_PUBLIC_SITE_URL (https).
// Muqobil: brauzerda https://<sayt>/api/telegram/setup?key=<CRON_SECRET>
import { setupTelegram } from "../lib/telegram/setup";

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (!token || !secret || !site?.startsWith("https://")) {
    throw new Error("TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET va https NEXT_PUBLIC_SITE_URL kerak");
  }
  console.log(await setupTelegram(token, secret, site));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
