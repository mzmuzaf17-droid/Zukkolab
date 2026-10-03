import { Api } from "grammy";

// Webhook, buyruqlar va menyu tugmasini o'rnatadi. Skript (pnpm bot:set-webhook) va
// /api/telegram/setup endpointi bir xil mantiqdan foydalanadi.
export async function setupTelegram(token: string, secret: string, site: string) {
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
  const [me, info] = await Promise.all([api.getMe(), api.getWebhookInfo()]);
  return { bot: `@${me.username}`, webhook: info.url, pending: info.pending_update_count };
}
