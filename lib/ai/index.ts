import "server-only";
import { getBranches, getCourses, getDirections, getFaq, useFixture } from "@/lib/data/content";
import type { Locale } from "@/lib/i18n/routing";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Enums } from "@/lib/supabase/types";
import { faqProvider } from "./faq";
import { geminiProvider } from "./gemini";
import type { AiKnowledge, AiReply, ChatMessage } from "./types";

export type { AiCta, AiReply } from "./types";

// Cheklovlar (9-bo'lim): sessiyaga soatiga 20 xabar; tarix — oxirgi 10 xabar.
export const HOURLY_LIMIT = 20;
const HISTORY = 10;

async function knowledge(): Promise<AiKnowledge> {
  const [courses, directions, branches, faq] = await Promise.all([
    getCourses(),
    getDirections(),
    getBranches(),
    getFaq(),
  ]);
  return { courses, directions, branches, faq };
}

export async function askAssistant(input: {
  sessionId: string;
  message: string;
  locale: Locale;
  channel: Enums<"channel">;
}): Promise<AiReply | { rateLimited: true }> {
  const { sessionId, message, locale, channel } = input;
  let history: ChatMessage[] = [];

  if (!useFixture) {
    const db = supabaseAdmin();
    const since = new Date(Date.now() - 60 * 60_000).toISOString();
    const { count } = await db
      .from("ai_messages")
      .select("id", { count: "exact", head: true })
      .eq("session_id", sessionId)
      .eq("role", "user")
      .gte("created_at", since);
    if ((count ?? 0) >= HOURLY_LIMIT) return { rateLimited: true };

    const { data } = await db
      .from("ai_messages")
      .select("role, content")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(HISTORY);
    history = (data ?? [])
      .reverse()
      .map((m) => ({ role: m.role as ChatMessage["role"], content: m.content }));
    await db.from("ai_messages").insert({ session_id: sessionId, channel, role: "user", content: message });
  }

  const messages = [...history, { role: "user" as const, content: message }];
  const context = { locale, knowledge: await knowledge() };
  let reply: AiReply;
  if (process.env.AI_PROVIDER === "gemini" && process.env.GEMINI_API_KEY) {
    // AI javob bermasa (xato yoki 10 soniya) — mehmon xato ko'rmaydi, faq rejimi javob beradi.
    reply = await geminiProvider.reply(messages, context).catch((err: unknown) => {
      console.error("ai: gemini failed, falling back to faq", err instanceof Error ? err.message : err);
      return faqProvider.reply(messages, context);
    });
  } else {
    reply = await faqProvider.reply(messages, context);
  }

  if (!useFixture) {
    await supabaseAdmin()
      .from("ai_messages")
      .insert({ session_id: sessionId, channel, role: "assistant", content: reply.text });
  }
  return reply;
}
