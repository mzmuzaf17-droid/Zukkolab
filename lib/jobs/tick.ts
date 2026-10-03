import "server-only";
import { formatTime } from "@/lib/format";
import {
  getSetting,
  notifyNewLead,
  processFollowups,
  processReminders,
  sendToGroup,
  telegramApi,
} from "@/lib/notify";
import { escapeHtml } from "@/lib/notify/templates";
import { formatUzPhone } from "@/lib/phone";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { groupT } from "@/lib/telegram/i18n";

type Row = { id: string; full_name: string; phone: string; created_at: string };

// Telegram guruhiga daqiqasiga 20 tadan ortiq xabar yuborib bo'lmaydi — SLA ogohlantirishlari bitta xabarga birlashtiriladi.
function slaMessage(title: string, rows: Row[]): string {
  const lines = rows.map(
    (r) =>
      `• ${escapeHtml(r.full_name)}, <a href="tel:${r.phone}">${formatUzPhone(r.phone)}</a> (${formatTime(r.created_at)})`,
  );
  return [`<b>${escapeHtml(title)}</b>`, ...lines].join("\n");
}

async function numberSetting(key: string, fallback: number) {
  const v = await getSetting(key);
  return typeof v === "number" ? v : fallback;
}

// POST /api/jobs/tick — har 5 daqiqada (10-bo'lim). Har qadam mustaqil: biri yiqilsa, boshqalari ishlaydi.
export async function runTick() {
  const db = supabaseAdmin();
  const report: Record<string, number | string> = {};
  const step = async (name: string, fn: () => Promise<number>) => {
    try {
      report[name] = await fn();
    } catch (e) {
      report[name] = `error: ${e instanceof Error ? e.message : String(e)}`;
    }
  };

  if (!telegramApi()) report.telegram = "not configured";

  // 1. Guruhga yetib bormagan lid kartalarini qayta yuborish.
  await step("resend", async () => {
    const { data, error } = await db.rpc("claim_unnotified_leads", { p_limit: 15 });
    if (error) throw new Error(error.message);
    let sent = 0;
    for (const id of data ?? []) {
      // claim belgini qo'ydi; notifyNewLead faqat bo'sh belgida yuboradi — shuning uchun avval bo'shatamiz.
      await db.from("leads").update({ group_notified_at: null }).eq("id", id);
      if (await notifyNewLead(id)) sent++;
    }
    return sent;
  });

  // 2. SLA: 15 daqiqa javobsiz yangi lidlar — bitta umumiy xabar.
  await step("sla", async () => {
    const minutes = await numberSetting("sla_minutes", 15);
    const { data, error } = await db.rpc("claim_sla_alerts", { p_minutes: minutes });
    if (error) throw new Error(error.message);
    const rows: Row[] = data ?? [];
    if (rows.length && !(await sendToGroup(slaMessage(groupT("uz")("sla", { minutes }), rows)))) {
      await db
        .from("leads")
        .update({ sla_alerted_at: null })
        .in(
          "id",
          rows.map((r) => r.id),
        );
      return 0;
    }
    return rows.length;
  });

  // 3. SLA eskalatsiya (30 daqiqa) — hozircha guruhga; admin shaxsiy chati panel bosqichida.
  await step("escalation", async () => {
    const minutes = await numberSetting("sla_escalation_minutes", 30);
    const { data, error } = await db.rpc("claim_sla_escalations", { p_minutes: minutes });
    if (error) throw new Error(error.message);
    const rows: Row[] = data ?? [];
    if (rows.length) await sendToGroup(slaMessage(groupT("uz")("slaEscalation"), rows));
    return rows.length;
  });

  // 4–5. Eslatmalar va 6. sinovdan keyingi xabarlar.
  await step("reminders24h", () => processReminders("24h"));
  await step("reminders2h", () => processReminders("2h"));
  await step("followups", () => processFollowups());

  return report;
}
