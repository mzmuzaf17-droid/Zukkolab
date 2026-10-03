import "server-only";

// Telegram guruhiga xabar (10-bo'lim) — bot 4-kunda ulanadi. Hozircha token bo'lmasa false qaytaradi:
// leads.group_notified_at bo'sh qoladi va tick keyinroq qayta yuboradi.
export async function notifyNewLead(leadId: string): Promise<boolean> {
  if (!process.env.TELEGRAM_BOT_TOKEN) return false;
  void leadId;
  return false;
}
