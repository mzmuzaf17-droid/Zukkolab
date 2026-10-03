// pnpm bot:set-webhook — Telegram'ga webhook manzili, buyruqlar va menyu tugmasini o'rnatadi.
// Kerak: TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, NEXT_PUBLIC_SITE_URL (https).
import { Api } from "grammy";

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (!token || !secret || !site?.startsWith("https://")) {
    throw new Error("TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET va https NEXT_PUBLIC_SITE_URL kerak");
  }
  const api = new Api(token);
  await api.setWebhook(`${site}/api/telegram/webhook`, {
    secret_token: secret,
    allowed_updates: ["message", "callback_query", "my_chat_member"],
    drop_pending_updates: true,
  });
  await api.setMyCommands([{ command: "start", description: "Menyu / Меню / Menu" }], {
    scope: { type: "all_private_chats" },
  });
  await api.setMyCommands(
    [
      { command: "setup", description: "Guruhni ulash" },
      { command: "stats", description: "Bugungi statistika" },
    ],
    { scope: { type: "all_group_chats" } },
  );
  // Chat pastidagi "Ochish" tugmasi — sayt Mini App sifatida.
  await api.setChatMenuButton({
    menu_button: { type: "web_app", text: "Zukkolab", web_app: { url: `${site}/uz?tg=1` } },
  });
  const info = await api.getWebhookInfo();
  console.log("Webhook:", info.url, "pending:", info.pending_update_count);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
