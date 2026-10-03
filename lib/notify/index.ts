import "server-only";
import { Api, InlineKeyboard } from "grammy";
import { formatDateTime } from "@/lib/format";
import { pick } from "@/lib/i18n/pick";
import { isLocale, type Locale } from "@/lib/i18n/routing";
import { levelScale } from "@/lib/levels";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Json, Tables } from "@/lib/supabase/types";
import { anyT, botT, groupT } from "@/lib/telegram/i18n";
import { escapeHtml, leadCardText } from "./templates";

const SEND_TIMEOUT_MS = 3000;

let api: Api | null | undefined;
export function telegramApi(): Api | null {
  if (api !== undefined) return api;
  api = process.env.TELEGRAM_BOT_TOKEN ? new Api(process.env.TELEGRAM_BOT_TOKEN) : null;
  return api;
}

function siteUrl(path = ""): string {
  return `${(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "")}${path}`;
}

// grammY o'z AbortSignal turidan foydalanadi; runtime'da standart signal bilan mos.
type Signal = Parameters<Api["sendMessage"]>[3];
function timeout(): Signal {
  return AbortSignal.timeout(SEND_TIMEOUT_MS) as unknown as Signal;
}

export async function getSetting(key: string): Promise<Json | null> {
  const { data } = await supabaseAdmin().from("settings").select("value").eq("key", key).maybeSingle();
  return data?.value ?? null;
}

export async function groupChatId(): Promise<number | null> {
  const v = await getSetting("tg_group_chat_id");
  return typeof v === "number" ? v : typeof v === "string" && /^-?\d+$/.test(v) ? Number(v) : null;
}

const asLocale = (v: string | null | undefined): Locale => (v && isLocale(v) ? v : "uz");

// ───────────── Guruhga lid kartasi ─────────────
type Slot = Pick<Tables<"trial_slots">, "starts_at"> & {
  branches: Pick<Tables<"branches">, "name_uz" | "name_ru" | "name_en"> | null;
};

export async function leadCard(leadId: string) {
  const { data: lead } = await supabaseAdmin()
    .from("leads")
    .select(
      "id, full_name, phone, source, operator_requested, is_demo_live, directions(slug, name_uz), students(full_name, age), bookings(created_at, trial_slots(starts_at, branches(name_uz, name_ru, name_en))), test_attempts!leads_test_attempt_fk(result_level, result_track, directions(slug))",
    )
    .eq("id", leadId)
    .maybeSingle();
  if (!lead) return null;

  const tg = groupT("uz");
  const all = anyT("uz");
  const direction = lead.directions as { slug: string; name_uz: string } | null;
  const bookings = (lead.bookings as { created_at: string; trial_slots: Slot | null }[] | null) ?? [];
  const latest = bookings.sort((a, b) => b.created_at.localeCompare(a.created_at))[0]?.trial_slots;
  const students = (lead.students as { full_name: string; age: number | null }[] | null) ?? [];
  const student = students.find((s) => s.full_name !== lead.full_name);
  const attempt = lead.test_attempts as {
    result_level: number | null;
    result_track: string | null;
    directions: { slug: string } | null;
  } | null;
  let test: string | null = null;
  if (attempt?.result_track) test = all(`test.tracks.${attempt.result_track as "frontend"}`);
  else if (attempt?.result_level) {
    const scale = levelScale(attempt.directions?.slug ?? "");
    test = scale
      ? (all.raw(`levels.${scale}`) as string[])[attempt.result_level - 1]
      : String(attempt.result_level);
  }

  const text = leadCardText(
    {
      fullName: lead.full_name,
      phone: lead.phone,
      direction: direction?.name_uz,
      source: lead.source,
      operator: lead.operator_requested,
      demo: lead.is_demo_live,
      booking: latest
        ? `${formatDateTime(latest.starts_at, "uz")} · ${latest.branches?.name_uz ?? ""}`
        : null,
      student: student ? `${student.full_name}${student.age ? `, ${student.age}` : ""}` : null,
      test,
    },
    (k) => tg(k as "name"),
  );
  const keyboard = new InlineKeyboard()
    .text(tg("btnTake"), `take:${lead.id}`)
    .text(tg("btnCalled"), `called:${lead.id}`)
    .row()
    .url(tg("btnOpen"), siteUrl(`/admin/leads?lead=${lead.id}`));
  return { text, keyboard };
}

async function sendLeadCard(leadId: string): Promise<boolean> {
  const tg = telegramApi();
  const chat = await groupChatId();
  if (!tg || !chat) return false;
  const card = await leadCard(leadId);
  if (!card) return false;
  try {
    await tg.sendMessage(chat, card.text, { parse_mode: "HTML", reply_markup: card.keyboard }, timeout());
    return true;
  } catch (e) {
    console.error("sendLeadCard", e);
    return false;
  }
}

// Lid yaratilganda darhol (3 soniya timeout). Muvaffaqiyatli bo'lsa — group_notified_at belgilanadi;
// aks holda bo'sh qoladi va tick qayta urinadi (10-bo'lim).
export async function notifyNewLead(leadId: string): Promise<boolean> {
  const db = supabaseAdmin();
  const { data } = await db
    .from("leads")
    .update({ group_notified_at: new Date().toISOString() })
    .eq("id", leadId)
    .is("group_notified_at", null)
    .select("id")
    .maybeSingle();
  if (!data) return false; // allaqachon yuborilgan yoki boshqa jarayon egallagan
  const ok = await sendLeadCard(leadId);
  if (!ok) await db.from("leads").update({ group_notified_at: null }).eq("id", leadId);
  return ok;
}

export async function sendToGroup(text: string, keyboard?: InlineKeyboard): Promise<boolean> {
  const tg = telegramApi();
  const chat = await groupChatId();
  if (!tg || !chat) return false;
  try {
    await tg.sendMessage(chat, text, { parse_mode: "HTML", reply_markup: keyboard }, timeout());
    return true;
  } catch (e) {
    console.error("sendToGroup", e);
    return false;
  }
}

// ───────────── Mijozga: eslatmalar va sinovdan keyingi xabarlar ─────────────
export async function bookingContext(bookingId: string) {
  const { data } = await supabaseAdmin()
    .from("bookings")
    .select(
      "id, lead_id, tg_chat_id, status, leads(full_name, locale, course_id), students(full_name), trial_slots(starts_at, branches(name_uz, name_ru, name_en, address_uz, address_ru, address_en, lat, lng), directions(slug, name_uz, name_ru, name_en))",
    )
    .eq("id", bookingId)
    .maybeSingle();
  if (!data?.trial_slots) return null;
  const slot = data.trial_slots as unknown as {
    starts_at: string;
    branches: Pick<
      Tables<"branches">,
      "name_uz" | "name_ru" | "name_en" | "address_uz" | "address_ru" | "address_en" | "lat" | "lng"
    >;
    directions: Pick<Tables<"directions">, "slug" | "name_uz" | "name_ru" | "name_en">;
  };
  const lead = data.leads as { full_name: string; locale: string; course_id: string | null } | null;
  const locale = asLocale(lead?.locale);
  return {
    id: data.id,
    leadId: data.lead_id,
    chatId: data.tg_chat_id,
    locale,
    leadName: lead?.full_name ?? "",
    courseId: lead?.course_id ?? null,
    studentName: (data.students as { full_name: string } | null)?.full_name ?? lead?.full_name ?? "",
    startsAt: slot.starts_at,
    branch: slot.branches,
    direction: slot.directions,
    when: formatDateTime(slot.starts_at, locale),
    branchName: pick(slot.branches, "name", locale),
    directionName: pick(slot.directions, "name", locale),
  };
}

export async function sendBoundMessage(bookingId: string): Promise<boolean> {
  const tg = telegramApi();
  const ctx = await bookingContext(bookingId);
  if (!tg || !ctx?.chatId) return false;
  const t = botT(ctx.locale);
  const { data } = await supabaseAdmin()
    .from("bookings")
    .select("demo_accelerated")
    .eq("id", bookingId)
    .maybeSingle();
  const lines = [t("bound", { direction: ctx.directionName, branch: ctx.branchName, when: ctx.when })];
  if (data?.demo_accelerated) lines.push("", t("boundDemo"));
  try {
    await tg.sendMessage(ctx.chatId, lines.join("\n"), undefined, timeout());
    return true;
  } catch (e) {
    console.error("sendBoundMessage", e);
    return false;
  }
}

export function rebookUrl(locale: Locale, directionSlug: string): string {
  return siteUrl(`/${locale}/sinov-darsi?direction=${directionSlug}&tg=1`);
}

export async function sendReminder(bookingId: string, kind: "24h" | "2h"): Promise<boolean> {
  const tg = telegramApi();
  const ctx = await bookingContext(bookingId);
  if (!tg || !ctx?.chatId) return false;
  const t = botT(ctx.locale);
  const text =
    kind === "24h"
      ? t("reminder24", { direction: ctx.directionName, branch: ctx.branchName, when: ctx.when })
      : t("reminder2", {
          when: ctx.when,
          branch: ctx.branchName,
          address: pick(ctx.branch, "address", ctx.locale),
        });
  const keyboard = new InlineKeyboard()
    .text(t("btnComing"), `rm:yes:${ctx.id}`)
    .row()
    .webApp(t("btnMove"), rebookUrl(ctx.locale, ctx.direction.slug))
    .text(t("btnCancel"), `rm:no:${ctx.id}`);
  try {
    await tg.sendMessage(
      ctx.chatId,
      escapeHtml(text),
      { parse_mode: "HTML", reply_markup: keyboard },
      timeout(),
    );
    if (kind === "2h")
      await tg.sendLocation(ctx.chatId, ctx.branch.lat, ctx.branch.lng, undefined, timeout());
    return true;
  } catch (e) {
    console.error("sendReminder", e);
    return false;
  }
}

export async function sendFollowup(bookingId: string, kind: "feedback" | "no_show"): Promise<boolean> {
  const tg = telegramApi();
  const ctx = await bookingContext(bookingId);
  if (!tg || !ctx?.chatId) return false;
  const t = botT(ctx.locale);
  try {
    if (kind === "no_show") {
      const kb = new InlineKeyboard().webApp(t("btnPickTime"), rebookUrl(ctx.locale, ctx.direction.slug));
      await tg.sendMessage(ctx.chatId, t("noShow"), { reply_markup: kb }, timeout());
    } else {
      const kb = new InlineKeyboard();
      for (const score of [1, 2, 3, 4, 5]) kb.text(String(score), `fb:${score}:${ctx.id}`);
      await tg.sendMessage(ctx.chatId, t("feedbackAsk"), { reply_markup: kb }, timeout());
    }
    return true;
  } catch (e) {
    console.error("sendFollowup", e);
    return false;
  }
}

// Egallangan har bir qator yuboriladi; yuborib bo'lmasa — belgi qaytariladi, keyingi tick qayta urinadi.
export async function processReminders(kind: "24h" | "2h"): Promise<number> {
  const db = supabaseAdmin();
  const { data, error } = await db.rpc("claim_reminders", { p_kind: kind });
  if (error) throw new Error(error.message);
  let sent = 0;
  for (const row of data ?? []) {
    if (await sendReminder(row.booking_id, kind)) sent++;
    else {
      const reset = kind === "24h" ? { reminder_24h_sent_at: null } : { reminder_2h_sent_at: null };
      await db.from("bookings").update(reset).eq("id", row.booking_id);
    }
  }
  return sent;
}

export async function processFollowups(): Promise<number> {
  const db = supabaseAdmin();
  const { data, error } = await db.rpc("claim_followups", {});
  if (error) throw new Error(error.message);
  let sent = 0;
  for (const row of data ?? []) {
    if (await sendFollowup(row.booking_id, row.kind === "no_show" ? "no_show" : "feedback")) sent++;
    else await db.from("bookings").update({ followup_sent_at: null }).eq("id", row.booking_id);
  }
  return sent;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Demo vaqt tezlatgichi (v1.1, 2-qaror): bron chatga bog'langach 30 s — "24 soat", 60 s — "2 soat",
// yana 30 s — "sinovdan keyin" baho so'rovi. Tick ham aynan shu shartlarni tekshiradi (zaxira).
export async function runDemoChain(): Promise<void> {
  await sleep(31_000);
  await processReminders("24h");
  await sleep(30_000);
  await processReminders("2h");
  await sleep(31_000);
  await processFollowups();
}
