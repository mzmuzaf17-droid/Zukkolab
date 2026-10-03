import "server-only";
import { Bot, InlineKeyboard, Keyboard, type Context } from "grammy";
import { after } from "next/server";
import {
  getBranches,
  getCourses,
  getOpenGroups,
  nextGroupFor,
  seatsLeft,
  todayInTashkent,
} from "@/lib/data/content";
import { createTelegramLead } from "@/lib/data/leads";
import { formatAmount, formatTime } from "@/lib/format";
import { pick } from "@/lib/i18n/pick";
import { locales, type Locale } from "@/lib/i18n/routing";
import { levelScale } from "@/lib/levels";
import {
  bookingContext,
  leadCard,
  notifyNewLead,
  rebookUrl,
  runDemoChain,
  sendBoundMessage,
  sendToGroup,
} from "@/lib/notify";
import { escapeHtml } from "@/lib/notify/templates";
import { normalizeUzPhone } from "@/lib/phone";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types";
import { anyT, botT, groupT, localeFromTelegram } from "./i18n";
import { parseStartParam } from "./start-param";

const siteUrl = (path: string) => `${(process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "")}${path}`;

// ───────────── Suhbat holati (tg_sessions) ─────────────
type SessionState = { source?: string };

async function getSession(chatId: number, fallback: Locale) {
  const { data } = await supabaseAdmin()
    .from("tg_sessions")
    .select("locale, state")
    .eq("chat_id", chatId)
    .maybeSingle();
  return {
    locale: (data?.locale as Locale | undefined) ?? fallback,
    state: (data?.state as SessionState | null) ?? {},
  };
}

async function saveSession(
  chatId: number,
  patch: { locale?: Locale; state?: SessionState; lead_id?: string },
) {
  await supabaseAdmin()
    .from("tg_sessions")
    .upsert(
      { chat_id: chatId, ...patch, state: (patch.state ?? undefined) as Json | undefined },
      { onConflict: "chat_id" },
    );
}

async function localeOf(ctx: Context): Promise<Locale> {
  const chatId = ctx.chat?.id;
  const fallback = localeFromTelegram(ctx.from?.language_code);
  return chatId ? (await getSession(chatId, fallback)).locale : fallback;
}

// ───────────── Mijoz menyusi: saytning o'zi Mini App sifatida ochiladi (v1.1, 1-qaror) ─────────────
function mainMenu(locale: Locale) {
  const t = botT(locale);
  const app = (path: string) => siteUrl(`/${locale}${path}${path.includes("?") ? "&" : "?"}tg=1`);
  return new InlineKeyboard()
    .webApp(t("menu.trial"), app("/sinov-darsi"))
    .row()
    .webApp(t("menu.test"), app("/test"))
    .webApp(t("menu.courses"), app("/kurslar"))
    .row()
    .text(t("menu.branches"), "m:branches")
    .text(t("menu.prices"), "m:prices")
    .row()
    .text(t("menu.operator"), "m:operator")
    .text(t("menu.language"), "m:lang");
}

async function sendMenu(ctx: Context, locale: Locale) {
  await ctx.reply(botT(locale)("welcome"), { reply_markup: mainMenu(locale) });
}

async function bindBooking(ctx: Context, bookingId: string, locale: Locale) {
  const chatId = ctx.chat!.id;
  const db = supabaseAdmin();
  const { data: booking } = await db
    .from("bookings")
    .update({ tg_chat_id: chatId })
    .eq("id", bookingId)
    .or(`tg_chat_id.is.null,tg_chat_id.eq.${chatId}`)
    .select("id, lead_id, demo_accelerated")
    .maybeSingle();
  const t = botT(locale);
  if (!booking) {
    await ctx.reply(t("bookingNotFound"));
    return;
  }
  await db
    .from("leads")
    .update({ tg_chat_id: chatId, tg_username: ctx.from?.username ?? null })
    .eq("id", booking.lead_id);
  await saveSession(chatId, { lead_id: booking.lead_id });
  await sendBoundMessage(booking.id);
  if (booking.demo_accelerated) after(runDemoChain);
}

async function sendTestResult(ctx: Context, attemptId: string, locale: Locale) {
  const { data } = await supabaseAdmin()
    .from("test_attempts")
    .select("result_level, result_track, directions(slug), courses(title_uz, title_ru, title_en)")
    .eq("id", attemptId)
    .maybeSingle();
  if (!data) return;
  const all = anyT(locale);
  const slug = (data.directions as { slug: string } | null)?.slug ?? "";
  const scale = levelScale(slug);
  const level = data.result_track
    ? all(`test.tracks.${data.result_track as "frontend"}`)
    : scale && data.result_level
      ? (all.raw(`levels.${scale}`) as string[])[data.result_level - 1]
      : String(data.result_level ?? "");
  const course = data.courses as { title_uz: string; title_ru: string; title_en: string } | null;
  await ctx.reply(
    botT(locale)("testResult", { level, course: course ? pick(course, "title", locale) : "—" }),
  );
}

// ───────────── Guruh yordamchilari ─────────────
async function memberName(ctx: Context) {
  const from = ctx.from!;
  const { data: profile } = await supabaseAdmin()
    .from("profiles")
    .select("id, full_name")
    .eq("tg_user_id", from.id)
    .eq("is_active", true)
    .maybeSingle();
  return {
    profileId: profile?.id ?? null,
    name: profile?.full_name ?? [from.first_name, from.last_name].filter(Boolean).join(" "),
  };
}

async function appendToCard(ctx: Context, line: string, keepCalled: boolean, leadId: string) {
  const card = await leadCard(leadId);
  const msg = ctx.callbackQuery?.message;
  const previous = msg && "text" in msg && msg.text ? msg.text.split("\n\n").slice(1).map(escapeHtml) : [];
  const html = [card?.text ?? "", ...previous].filter(Boolean).join("\n\n");
  const tg = groupT("uz");
  const kb = new InlineKeyboard();
  if (keepCalled) kb.text(tg("btnCalled"), `called:${leadId}`).row();
  kb.url(tg("btnOpen"), siteUrl(`/admin/leads?lead=${leadId}`));
  await ctx
    .editMessageText(`${html}\n\n${escapeHtml(line)}`, { parse_mode: "HTML", reply_markup: kb })
    .catch(() => undefined);
}

// ───────────── Bot ─────────────
export function createBot(token: string) {
  const bot = new Bot(token);
  const db = () => supabaseAdmin();

  // Har qanday xato Telegram'ga 200 qaytaradi (qayta yuborish bo'roni bo'lmasin), log'ga yoziladi.
  bot.catch((err) => console.error("telegram bot", err.error));

  const privateChat = bot.chatType("private");
  const groupChat = bot.chatType(["group", "supergroup"]);

  privateChat.command("start", async (ctx) => {
    const fallback = localeFromTelegram(ctx.from?.language_code);
    const session = await getSession(ctx.chat.id, fallback);
    const param = parseStartParam(ctx.match);
    if (param.kind === "src") {
      await saveSession(ctx.chat.id, {
        locale: session.locale,
        state: { ...session.state, source: param.value },
      });
    } else {
      await saveSession(ctx.chat.id, { locale: session.locale });
    }
    if (param.kind === "booking") await bindBooking(ctx, param.value, session.locale);
    if (param.kind === "test") await sendTestResult(ctx, param.value, session.locale);
    await sendMenu(ctx, session.locale);
  });

  bot.callbackQuery("m:branches", async (ctx) => {
    await ctx.answerCallbackQuery();
    const locale = await localeOf(ctx);
    await ctx.reply(botT(locale)("branchesIntro"));
    for (const b of await getBranches()) {
      await ctx.replyWithVenue(b.lat, b.lng, pick(b, "name", locale), pick(b, "address", locale));
    }
  });

  bot.callbackQuery("m:prices", async (ctx) => {
    await ctx.answerCallbackQuery();
    const locale = await localeOf(ctx);
    const prices = (await getCourses()).map((c) => c.price_monthly);
    await ctx.reply(
      botT(locale)("prices", {
        from: formatAmount(Math.min(...prices), locale),
        to: formatAmount(Math.max(...prices), locale),
      }),
    );
  });

  bot.callbackQuery("m:operator", async (ctx) => {
    await ctx.answerCallbackQuery();
    const t = botT(await localeOf(ctx));
    await ctx.reply(t("operatorAsk"), {
      reply_markup: new Keyboard().requestContact(t("shareContact")).oneTime().resized(),
    });
  });

  bot.callbackQuery("m:lang", async (ctx) => {
    await ctx.answerCallbackQuery();
    const t = anyT(await localeOf(ctx));
    const kb = new InlineKeyboard();
    for (const l of locales) kb.text(t(`locales.${l}`), `lang:${l}`);
    await ctx.reply(botT(await localeOf(ctx))("chooseLanguage"), { reply_markup: kb });
  });

  bot.callbackQuery(/^lang:(uz|ru|en)$/, async (ctx) => {
    const locale = ctx.match[1] as Locale;
    await ctx.answerCallbackQuery(botT(locale)("languageSet"));
    if (ctx.chat) await saveSession(ctx.chat.id, { locale });
    await sendMenu(ctx, locale);
  });

  // Operator: Telegram kontakti bir tugmada — lid "operator so'radi" belgisi bilan, guruhga xabar.
  privateChat.on("message:contact", async (ctx) => {
    const contact = ctx.message.contact;
    const locale = await localeOf(ctx);
    const t = botT(locale);
    const phone = normalizeUzPhone(contact.phone_number);
    if (contact.user_id !== ctx.from.id || !phone) {
      await ctx.reply(t("operatorAsk"));
      return;
    }
    const session = await getSession(ctx.chat.id, locale);
    const { leadId, duplicate } = await createTelegramLead({
      fullName: [contact.first_name, contact.last_name].filter(Boolean).join(" ") || ctx.from.first_name,
      phone,
      locale,
      source: session.state.source ?? "telegram",
      chatId: ctx.chat.id,
      username: ctx.from.username,
      operator: true,
    });
    await saveSession(ctx.chat.id, { lead_id: leadId });
    await ctx.reply(t("operatorDone"), { reply_markup: { remove_keyboard: true } });
    if (duplicate) await db().from("leads").update({ group_notified_at: null }).eq("id", leadId);
    after(() => notifyNewLead(leadId));
  });

  // Eslatma tugmalari: Kelaman / Bekor qilish (vaqtni o'zgartirish — Mini App).
  bot.callbackQuery(/^rm:(yes|no):([0-9a-f-]{36})$/, async (ctx) => {
    const [, action, bookingId] = ctx.match;
    const locale = await localeOf(ctx);
    const t = botT(locale);
    const chatId = ctx.chat!.id;
    if (action === "yes") {
      const { data } = await db()
        .from("bookings")
        .update({ confirmed_at: new Date().toISOString() })
        .eq("id", bookingId)
        .eq("tg_chat_id", chatId)
        .select("lead_id")
        .maybeSingle();
      if (data)
        await db()
          .from("lead_events")
          .insert({ lead_id: data.lead_id, type: "confirmed", payload: { booking_id: bookingId } });
      await ctx.answerCallbackQuery(t("confirmed"));
      await ctx.editMessageReplyMarkup({ reply_markup: undefined }).catch(() => undefined);
      await ctx.reply(t("confirmed"));
    } else {
      const c = await bookingContext(bookingId);
      await db()
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId)
        .eq("tg_chat_id", chatId)
        .eq("status", "booked");
      if (c)
        await db()
          .from("lead_events")
          .insert({ lead_id: c.leadId, type: "cancelled_by_client", payload: { booking_id: bookingId } });
      await ctx.answerCallbackQuery();
      await ctx.editMessageReplyMarkup({ reply_markup: undefined }).catch(() => undefined);
      await ctx.reply(t("cancelled"), {
        reply_markup: c
          ? new InlineKeyboard().webApp(t("btnPickTime"), rebookUrl(locale, c.direction.slug))
          : undefined,
      });
    }
  });

  // Sinovdan keyingi baho: 1–3 bo'lsa guruhga "Ota-onadan xabar" (v1.1, 5-qaror).
  bot.callbackQuery(/^fb:([1-5]):([0-9a-f-]{36})$/, async (ctx) => {
    const score = Number(ctx.match[1]);
    const bookingId = ctx.match[2];
    const locale = await localeOf(ctx);
    const t = botT(locale);
    const { data } = await db()
      .from("bookings")
      .update({ feedback_score: score })
      .eq("id", bookingId)
      .eq("tg_chat_id", ctx.chat!.id)
      .is("feedback_score", null)
      .select("id, lead_id")
      .maybeSingle();
    await ctx.answerCallbackQuery();
    await ctx.editMessageReplyMarkup({ reply_markup: undefined }).catch(() => undefined);
    if (!data) return;
    await db()
      .from("lead_events")
      .insert({ lead_id: data.lead_id, type: "feedback", payload: { booking_id: bookingId, score } });
    const c = await bookingContext(bookingId);
    const lines = [t("feedbackThanks", { score })];
    let kb: InlineKeyboard | undefined;
    if (score >= 4 && c?.courseId) {
      const group = nextGroupFor(c.courseId, await getOpenGroups());
      if (group) {
        lines.push("", t("enrollOffer", { seats: seatsLeft(group) }));
        kb = new InlineKeyboard().text(t("btnEnroll"), `en:${bookingId}`);
      }
    }
    await ctx.reply(lines.join("\n"), { reply_markup: kb });
    if (score <= 3 && c) {
      const { data: claimed } = await db()
        .from("bookings")
        .update({ feedback_alerted_at: new Date().toISOString() })
        .eq("id", bookingId)
        .is("feedback_alerted_at", null)
        .select("id")
        .maybeSingle();
      if (claimed) await sendToGroup(escapeHtml(groupT("uz")("parentAlert", { name: c.leadName, score })));
    }
  });

  bot.callbackQuery(/^en:([0-9a-f-]{36})$/, async (ctx) => {
    const bookingId = ctx.match[1];
    const t = botT(await localeOf(ctx));
    const c = await bookingContext(bookingId);
    await ctx.answerCallbackQuery();
    await ctx.editMessageReplyMarkup({ reply_markup: undefined }).catch(() => undefined);
    if (!c || c.chatId !== ctx.chat?.id) return;
    await db()
      .from("lead_events")
      .insert({ lead_id: c.leadId, type: "wants_enroll", payload: { booking_id: bookingId } });
    await ctx.reply(t("enrollDone"));
    await sendToGroup(escapeHtml(groupT("uz")("enroll", { name: c.leadName })));
  });

  // ───────────── Menejerlar guruhi ─────────────
  groupChat.command("setup", async (ctx) => {
    const tg = groupT("uz");
    const member = await ctx.getChatMember(ctx.from!.id);
    if (!["creator", "administrator"].includes(member.status)) {
      await ctx.reply(tg("setupDenied"));
      return;
    }
    await db()
      .from("settings")
      .upsert({ key: "tg_group_chat_id", value: ctx.chat.id }, { onConflict: "key" });
    await ctx.reply(tg("setupDone"));
  });

  groupChat.command("stats", async (ctx) => {
    const since = new Date(`${todayInTashkent()}T00:00:00+05:00`).toISOString();
    const count = (table: "leads" | "bookings", column = "created_at") =>
      db()
        .from(table)
        .select("id", { count: "exact", head: true })
        .gte(column, since)
        .then((r) => r.count ?? 0);
    const [leads, bookings, paid] = await Promise.all([
      count("leads"),
      count("bookings"),
      count("leads", "paid_at"),
    ]);
    await ctx.reply(groupT("uz")("stats", { leads, bookings, paid }));
  });

  // "Men oldim": lid bosgan menejerga biriktiriladi; xabar tahrirlanadi — ikki kishi bitta lidga qo'ng'iroq qilmaydi.
  bot.callbackQuery(/^take:([0-9a-f-]{36})$/, async (ctx) => {
    const leadId = ctx.match[1];
    const { profileId, name } = await memberName(ctx);
    const { data: existing } = await db()
      .from("lead_events")
      .select("payload")
      .eq("lead_id", leadId)
      .eq("type", "taken")
      .limit(1)
      .maybeSingle();
    if (existing) {
      await ctx.answerCallbackQuery({
        text: String((existing.payload as { name?: string }).name ?? ""),
        show_alert: true,
      });
      return;
    }
    await db()
      .from("lead_events")
      .insert({
        lead_id: leadId,
        type: "taken",
        actor_id: profileId,
        payload: { name, tg_user_id: ctx.from.id },
      });
    if (profileId) await db().from("leads").update({ assigned_to: profileId }).eq("id", leadId);
    await ctx.answerCallbackQuery();
    await appendToCard(
      ctx,
      groupT("uz")("taken", { name, time: formatTime(new Date().toISOString()) }),
      true,
      leadId,
    );
  });

  bot.callbackQuery(/^called:([0-9a-f-]{36})$/, async (ctx) => {
    const leadId = ctx.match[1];
    const { profileId, name } = await memberName(ctx);
    await db().from("leads").update({ status: "contacted" }).eq("id", leadId).eq("status", "new");
    await db()
      .from("lead_events")
      .insert({ lead_id: leadId, type: "called", actor_id: profileId, payload: { name } });
    await ctx.answerCallbackQuery();
    await appendToCard(
      ctx,
      groupT("uz")("called", { name, time: formatTime(new Date().toISOString()) }),
      false,
      leadId,
    );
  });

  // Menyudan tashqari matn: hozircha yo'naltirish (AI yordamchi 6-kunda).
  privateChat.on("message:text", async (ctx) => {
    const locale = await localeOf(ctx);
    await ctx.reply(botT(locale)("unknown"), { reply_markup: mainMenu(locale) });
  });

  return bot;
}
