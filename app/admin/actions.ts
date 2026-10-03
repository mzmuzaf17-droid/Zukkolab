"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin, requireStaff } from "@/lib/admin/auth";
import { NEXT_STATUSES } from "@/lib/admin/labels";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { setupTelegram } from "@/lib/telegram/setup";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/supabase/types";

export type ActionResult = { ok: true } | { ok: false; error: string };

const uuid = z.uuid();
const statusSchema = z.enum(["new", "contacted", "trial_booked", "trial_attended", "paid", "lost"]);
const reasonSchema = z.enum(["expensive", "far", "schedule", "no_answer", "other"]);

// Holat faqat ruxsat etilgan yo'nalishda; "Yo'qotildi" — sabab majburiy; "To'ladi" — summa (8-bo'lim).
// Ruxsatni baza ham (trigger) tekshiradi — bu yerda foydalanuvchiga tushunarli xato uchun.
export async function updateLeadStatus(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  await requireStaff();
  const parsed = z
    .object({
      leadId: uuid,
      status: statusSchema,
      lostReason: reasonSchema.optional(),
      paidAmount: z.coerce.number().int().min(0).max(100_000_000).optional(),
    })
    .safeParse({
      leadId: form.get("leadId"),
      status: form.get("status"),
      lostReason: form.get("lostReason") || undefined,
      paidAmount: form.get("paidAmount") || undefined,
    });
  if (!parsed.success) return { ok: false, error: "Maydonlarni tekshiring" };
  const { leadId, status, lostReason, paidAmount } = parsed.data;
  if (status === "lost" && !lostReason) return { ok: false, error: "Yoʻqotilish sababini tanlang" };

  const supabase = await createSupabaseServerClient();
  const { data: lead } = await supabase.from("leads").select("status").eq("id", leadId).maybeSingle();
  if (!lead) return { ok: false, error: "Lid topilmadi" };
  if (!NEXT_STATUSES[lead.status].includes(status)) return { ok: false, error: "Bu holatga oʻtib boʻlmaydi" };

  const { error } = await supabase
    .from("leads")
    .update({
      status,
      lost_reason: status === "lost" ? lostReason : null,
      ...(status === "paid" && paidAmount ? { paid_amount: paidAmount } : {}),
    })
    .eq("id", leadId);
  if (error)
    return {
      ok: false,
      error: error.message.includes("INVALID_TRANSITION") ? "Bu holatga oʻtib boʻlmaydi" : "Saqlab boʻlmadi",
    };
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function assignToMe(form: FormData): Promise<void> {
  const staff = await requireStaff();
  const leadId = uuid.parse(form.get("leadId"));
  const supabase = await createSupabaseServerClient();
  await supabase.from("leads").update({ assigned_to: staff.id }).eq("id", leadId);
  revalidatePath("/admin", "layout");
}

export async function addNote(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  const staff = await requireStaff();
  const parsed = z
    .object({ leadId: uuid, text: z.string().trim().min(1).max(1000) })
    .safeParse({ leadId: form.get("leadId"), text: form.get("text") });
  if (!parsed.success) return { ok: false, error: "Izoh boʻsh" };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("lead_events").insert({
    lead_id: parsed.data.leadId,
    type: "note",
    actor_id: staff.id,
    payload: { text: parsed.data.text },
  });
  if (error) return { ok: false, error: "Saqlab boʻlmadi" };
  revalidatePath("/admin", "layout");
  return { ok: true };
}

// FR-ADM-09: sinov darsidan keyin "Keldi" / "Kelmadi" — lid holati trigger orqali o'zgaradi.
export async function markAttendance(form: FormData): Promise<void> {
  await requireStaff();
  const bookingId = uuid.parse(form.get("bookingId"));
  const status = z.enum(["attended", "no_show"]).parse(form.get("status")) as Enums<"booking_status">;
  const supabase = await createSupabaseServerClient();
  await supabase
    .from("bookings")
    .update({ status })
    .eq("id", bookingId)
    .in("status", ["booked", "attended", "no_show"]);
  revalidatePath("/admin", "layout");
}

// Reklama xarajati (v1.1, 3-qaror) — haftalik, faqat admin.
export async function saveAdSpend(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = z
    .object({
      source: z
        .string()
        .trim()
        .toLowerCase()
        .regex(/^[a-z0-9_-]{2,40}$/),
      weekStart: z.iso.date(),
      amount: z.coerce.number().int().min(0).max(10_000_000_000),
    })
    .safeParse({ source: form.get("source"), weekStart: form.get("weekStart"), amount: form.get("amount") });
  if (!parsed.success) return { ok: false, error: "Maydonlarni tekshiring" };
  // Hafta har doim dushanbadan boshlanadi.
  const d = new Date(`${parsed.data.weekStart}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("ad_spend")
    .upsert(
      { source: parsed.data.source, week_start: d.toISOString().slice(0, 10), amount: parsed.data.amount },
      { onConflict: "source,week_start" },
    );
  if (error) return { ok: false, error: "Saqlab boʻlmadi" };
  revalidatePath("/admin", "layout");
  return { ok: true };
}

// FR-ADM-13: Demo reset — tasdiqlash so'zi bilan, faqat admin va faqat demo rejimida.
export async function resetDemo(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  await requireAdmin();
  if (process.env.DEMO_MODE === "false") return { ok: false, error: "Demo rejim oʻchirilgan" };
  if (form.get("confirm") !== "DEMO") return { ok: false, error: "Tasdiqlash uchun DEMO deb yozing" };
  const { error } = await supabaseAdmin().rpc("reset_demo_data");
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true };
}

// Telegram'ni panel tugmasi bilan ulash: webhook, buyruqlar va Mini App tugmasi. Sirlar faqat serverda o'qiladi.
export async function connectTelegram(): Promise<ActionResult & { info?: string }> {
  await requireAdmin();
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (!token || !secret || !site) {
    return {
      ok: false,
      error: "Vercel’da TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET va NEXT_PUBLIC_SITE_URL boʻlishi kerak",
    };
  }
  try {
    const r = await setupTelegram(token, secret, site);
    revalidatePath("/admin/settings");
    return { ok: true, info: `${r.bot} ulandi → ${r.webhook}` };
  } catch (e) {
    return { ok: false, error: `Telegram xatosi: ${e instanceof Error ? e.message : String(e)}` };
  }
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
