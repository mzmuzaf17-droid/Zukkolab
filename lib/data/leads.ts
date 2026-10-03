import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { isDemoMode } from "@/lib/env";
import type { Locale } from "@/lib/i18n/routing";
import { normalizeSource, type SourceInfo } from "@/lib/leads/source";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Tables } from "@/lib/supabase/types";
import {
  getBranches,
  getCourses,
  getDirections,
  todayInTashkent,
  useFixture,
  type Branch,
  type Direction,
} from "./content";

export type Slot = { id: string; startsAt: string; left: number };
export type BookingDetails = {
  id: string;
  startsAt: string;
  durationMin: number;
  leadName: string;
  studentName: string | null;
  branch: Branch;
  direction: Direction;
  cancelToken: string;
};
export type BookingResult =
  | { ok: true; bookingId: string; leadId: string; chatBound: boolean; demo: boolean }
  | { ok: false; code: "SLOT_FULL" | "ALREADY_BOOKED" | "NOT_FOUND"; startsAt?: string };

const HORIZON_DAYS = 14;
const MIN_LEAD_MS = 2 * 60 * 60 * 1000; // darsga 2 soatdan kam qolgan slot ko'rsatilmaydi
const DEDUP_MS = 24 * 60 * 60 * 1000;

// ───────────── Lokal dev store (DATA_SOURCE=fixture): Supabase'siz forma oqimini sinash uchun ─────────────
type DevBooking = {
  id: string;
  leadId: string;
  slotId: string;
  studentName: string | null;
  leadName: string;
  cancelToken: string;
};
type DevStore = {
  booked: Map<string, number>;
  bookings: Map<string, DevBooking>;
  leads: Map<string, { phone: string; at: number }>;
};
const g = globalThis as unknown as { __zkDev?: DevStore };
const dev = (g.__zkDev ??= { booked: new Map(), bookings: new Map(), leads: new Map() });

function stableUuid(key: string): string {
  const h = createHash("sha1").update(key).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

function tashkentToUtc(date: string, time: string): Date {
  return new Date(`${date}T${time}:00+05:00`);
}

async function fixtureSlots(directionId: string, branchId: string): Promise<(Slot & { capacity: number })[]> {
  const today = todayInTashkent();
  const out: (Slot & { capacity: number })[] = [];
  for (let day = 0; day < HORIZON_DAYS; day++) {
    const d = new Date(`${today}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + day);
    if (d.getUTCDay() === 0) continue; // yakshanba — dam olish
    const date = d.toISOString().slice(0, 10);
    for (const time of ["10:00", "15:00", "18:00"]) {
      const id = stableUuid(`slot:${branchId}:${directionId}:${date}:${time}`);
      const base = parseInt(id.slice(0, 2), 16) % 5;
      const capacity = 6;
      const left = capacity - base - (dev.booked.get(id) ?? 0);
      out.push({ id, startsAt: tashkentToUtc(date, time).toISOString(), left, capacity });
    }
  }
  return out;
}

// ───────────── Slotlar ─────────────
export async function getAvailableSlots(directionSlug: string, branchSlug: string): Promise<Slot[]> {
  const [direction, branch] = await Promise.all([
    getDirections().then((ds) => ds.find((d) => d.slug === directionSlug)),
    getBranches().then((bs) => bs.find((b) => b.slug === branchSlug)),
  ]);
  if (!direction || !branch) return [];
  const from = new Date(Date.now() + MIN_LEAD_MS);
  const to = new Date(Date.now() + HORIZON_DAYS * 86_400_000);

  if (useFixture) {
    return (await fixtureSlots(direction.id, branch.id))
      .filter((s) => s.left > 0 && new Date(s.startsAt) > from)
      .map(({ id, startsAt, left }) => ({ id, startsAt, left }));
  }
  const { data, error } = await supabaseAdmin()
    .from("trial_slots")
    .select("id, starts_at, capacity, booked_count")
    .eq("direction_id", direction.id)
    .eq("branch_id", branch.id)
    .gt("starts_at", from.toISOString())
    .lt("starts_at", to.toISOString())
    .order("starts_at");
  if (error) throw new Error(error.message);
  return data
    .filter((s) => s.booked_count < s.capacity)
    .map((s) => ({ id: s.id, startsAt: s.starts_at, left: s.capacity - s.booked_count }));
}

// ───────────── Lid ─────────────
type LeadFields = {
  fullName: string;
  phone: string;
  locale: Locale;
  directionId?: string;
  courseId?: string;
  source: SourceInfo;
  channel?: "web" | "telegram" | "miniapp";
  demoLive?: boolean;
};

// Takror lid yo'q: bir xil telefon 24 soat ichida kelsa — mavjudi yangilanadi (4-bo'lim).
async function upsertLead(f: LeadFields): Promise<{ leadId: string; duplicate: boolean }> {
  const db = supabaseAdmin();
  const since = new Date(Date.now() - DEDUP_MS).toISOString();
  const { data: existing, error: findError } = await db
    .from("leads")
    .select("id, direction_id, course_id")
    .eq("phone", f.phone)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (findError) throw new Error(findError.message);

  if (existing) {
    await db
      .from("leads")
      .update({
        full_name: f.fullName,
        direction_id: existing.direction_id ?? f.directionId ?? null,
        course_id: existing.course_id ?? f.courseId ?? null,
      })
      .eq("id", existing.id);
    await db
      .from("lead_events")
      .insert({ lead_id: existing.id, type: "duplicate_submit", payload: { channel: f.channel ?? "web" } });
    return { leadId: existing.id, duplicate: true };
  }

  let refAttemptId: string | null = null;
  if (f.source.ref) {
    const { data } = await db.from("test_attempts").select("id").eq("id", f.source.ref).maybeSingle();
    refAttemptId = data?.id ?? null;
  }
  const { data, error } = await db
    .from("leads")
    .insert({
      full_name: f.fullName,
      phone: f.phone,
      locale: f.locale,
      channel: f.channel ?? "web",
      direction_id: f.directionId ?? null,
      course_id: f.courseId ?? null,
      source: normalizeSource({ ...f.source, ref: refAttemptId ?? undefined }),
      utm_source: f.source.utm_source ?? null,
      utm_medium: f.source.utm_medium ?? null,
      utm_campaign: f.source.utm_campaign ?? null,
      utm_content: f.source.utm_content ?? null,
      referrer: f.source.referrer ?? null,
      ref_attempt_id: refAttemptId,
      is_demo_live: f.demoLive ?? false,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return { leadId: data.id, duplicate: false };
}

async function ids(directionSlug?: string, courseSlug?: string) {
  const [directions, courses] = await Promise.all([getDirections(), getCourses()]);
  const course = courses.find((c) => c.slug === courseSlug);
  const direction =
    directions.find((d) => d.slug === directionSlug) ?? directions.find((d) => d.id === course?.direction_id);
  return { directionId: direction?.id, courseId: course?.id };
}

export async function createLead(input: {
  fullName: string;
  phone: string;
  locale: Locale;
  directionSlug?: string;
  courseSlug?: string;
  source: SourceInfo;
}): Promise<{ leadId: string; duplicate: boolean }> {
  if (useFixture) {
    const prev = [...dev.leads.entries()].find(
      ([, l]) => l.phone === input.phone && Date.now() - l.at < DEDUP_MS,
    );
    if (prev) return { leadId: prev[0], duplicate: true };
    const leadId = randomUUID();
    dev.leads.set(leadId, { phone: input.phone, at: Date.now() });
    return { leadId, duplicate: false };
  }
  return upsertLead({ ...input, ...(await ids(input.directionSlug, input.courseSlug)) });
}

// Telegram'dan kelgan lid (operator so'radi yoki Mini App): kontakt va chat bog'lanadi.
export async function createTelegramLead(input: {
  fullName: string;
  phone: string;
  locale: Locale;
  source: string;
  chatId: number;
  username?: string;
  operator?: boolean;
}): Promise<{ leadId: string; duplicate: boolean }> {
  const result = await upsertLead({
    fullName: input.fullName,
    phone: input.phone,
    locale: input.locale,
    source: { utm_source: input.source === "telegram" ? "tg" : input.source },
    channel: "telegram",
  });
  await supabaseAdmin()
    .from("leads")
    .update({
      tg_chat_id: input.chatId,
      tg_username: input.username ?? null,
      ...(input.operator ? { operator_requested: true } : {}),
    })
    .eq("id", result.leadId);
  return result;
}

// ───────────── Bron ─────────────
export async function createBooking(input: {
  slotId: string;
  fullName: string;
  phone: string;
  studentName?: string;
  studentAge?: number;
  courseSlug?: string;
  testAttemptId?: string;
  demo?: boolean;
  locale: Locale;
  source: SourceInfo;
  tgUser?: { id: number; username?: string } | null;
}): Promise<BookingResult> {
  const demoAccelerated = Boolean(input.demo && isDemoMode());

  if (useFixture) {
    const studentKey = (input.studentName ?? input.fullName).toLowerCase();
    const dup = [...dev.bookings.values()].find(
      (b) =>
        dev.leads.get(b.leadId)?.phone === input.phone &&
        (b.studentName ?? b.leadName).toLowerCase() === studentKey,
    );
    if (dup) return { ok: false, code: "ALREADY_BOOKED" };
    const { leadId } = await createLead({ ...input });
    const id = randomUUID();
    dev.booked.set(input.slotId, (dev.booked.get(input.slotId) ?? 0) + 1);
    dev.bookings.set(id, {
      id,
      leadId,
      slotId: input.slotId,
      studentName: input.studentName ?? null,
      leadName: input.fullName,
      cancelToken: randomUUID(),
    });
    return { ok: true, bookingId: id, leadId, chatBound: false, demo: demoAccelerated };
  }

  const db = supabaseAdmin();
  const { data: slot } = await db
    .from("trial_slots")
    .select("id, direction_id")
    .eq("id", input.slotId)
    .maybeSingle();
  if (!slot) return { ok: false, code: "NOT_FOUND" };

  const { courseId } = await ids(undefined, input.courseSlug);
  const { leadId } = await upsertLead({
    fullName: input.fullName,
    phone: input.phone,
    locale: input.locale,
    directionId: slot.direction_id,
    courseId,
    source: input.source,
    demoLive: demoAccelerated,
    channel: input.tgUser ? "miniapp" : "web",
  });

  // O'quvchi: ota-ona bitta telefon bilan bir nechta farzandni yozishi mumkin (v1.1, 6-qaror).
  const studentName = input.studentName ?? input.fullName;
  const { data: students } = await db.from("students").select("id, full_name").eq("lead_id", leadId);
  let studentId = students?.find((s) => s.full_name.toLowerCase() === studentName.toLowerCase())?.id;
  if (!studentId) {
    const { data, error } = await db
      .from("students")
      .insert({ lead_id: leadId, full_name: studentName, age: input.studentAge ?? null })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    studentId = data.id;
  }

  const { data: booking, error } = await db.rpc("book_trial", {
    p_slot_id: input.slotId,
    p_lead_id: leadId,
    p_student_id: studentId,
    p_demo_accelerated: demoAccelerated,
  });
  if (error) {
    if (error.message.includes("SLOT_FULL")) return { ok: false, code: "SLOT_FULL" };
    if (error.message.includes("SLOT_NOT_FOUND")) return { ok: false, code: "NOT_FOUND" };
    if (error.message.includes("ALREADY_BOOKED")) {
      const { data: existing } = await db
        .from("bookings")
        .select("trial_slots(starts_at)")
        .eq("lead_id", leadId)
        .eq("student_id", studentId)
        .eq("status", "booked")
        .limit(1)
        .maybeSingle();
      const startsAt = (existing?.trial_slots as { starts_at: string } | null)?.starts_at;
      return { ok: false, code: "ALREADY_BOOKED", startsAt };
    }
    throw new Error(error.message);
  }

  if (input.tgUser) {
    await db.from("bookings").update({ tg_chat_id: input.tgUser.id }).eq("id", booking.id);
    await db
      .from("leads")
      .update({ tg_chat_id: input.tgUser.id, tg_username: input.tgUser.username ?? null })
      .eq("id", leadId);
  }

  if (input.testAttemptId) {
    await db
      .from("test_attempts")
      .update({ lead_id: leadId })
      .eq("id", input.testAttemptId)
      .is("lead_id", null);
    await db
      .from("leads")
      .update({ test_attempt_id: input.testAttemptId })
      .eq("id", leadId)
      .is("test_attempt_id", null);
  }
  return { ok: true, bookingId: booking.id, leadId, chatBound: Boolean(input.tgUser), demo: demoAccelerated };
}

export async function getBookingDetails(bookingId: string): Promise<BookingDetails | null> {
  const [branches, directions] = await Promise.all([getBranches(), getDirections()]);

  if (useFixture) {
    const b = dev.bookings.get(bookingId);
    if (!b) return null;
    for (const branch of branches) {
      for (const direction of directions) {
        const slot = (await fixtureSlots(direction.id, branch.id)).find((s) => s.id === b.slotId);
        if (slot) {
          return {
            id: b.id,
            startsAt: slot.startsAt,
            durationMin: 60,
            leadName: b.leadName,
            studentName: b.studentName,
            branch,
            direction,
            cancelToken: b.cancelToken,
          };
        }
      }
    }
    return null;
  }

  const { data, error } = await supabaseAdmin()
    .from("bookings")
    .select(
      "id, cancel_token, leads(full_name), students(full_name), trial_slots(starts_at, duration_min, branch_id, direction_id)",
    )
    .eq("id", bookingId)
    .maybeSingle();
  if (error || !data) return null;
  const slot = data.trial_slots as Pick<
    Tables<"trial_slots">,
    "starts_at" | "duration_min" | "branch_id" | "direction_id"
  > | null;
  const branch = branches.find((b) => b.id === slot?.branch_id);
  const direction = directions.find((d) => d.id === slot?.direction_id);
  if (!slot || !branch || !direction) return null;
  const leadName = (data.leads as { full_name: string } | null)?.full_name ?? "";
  const studentName = (data.students as { full_name: string } | null)?.full_name ?? null;
  return {
    id: data.id,
    startsAt: slot.starts_at,
    durationMin: slot.duration_min,
    leadName,
    studentName: studentName && studentName !== leadName ? studentName : null,
    branch,
    direction,
    cancelToken: data.cancel_token,
  };
}

// ───────────── Test natijasi ─────────────
export async function saveTestAttempt(a: {
  directionId: string;
  sessionId: string;
  questionIds: string[];
  answers: Record<string, string>;
  score: number;
  maxScore: number;
  level: number | null;
  track: string | null;
  recommendedCourseId: string | null;
  locale: Locale;
}): Promise<string> {
  if (useFixture) return stableUuid(`attempt:${a.sessionId}:${Date.now()}`);
  const { data, error } = await supabaseAdmin()
    .from("test_attempts")
    .insert({
      direction_id: a.directionId,
      session_id: a.sessionId,
      question_ids: a.questionIds,
      answers: a.answers,
      score: a.score,
      max_score: a.maxScore,
      result_level: a.level,
      result_track: a.track,
      recommended_course_id: a.recommendedCourseId,
      locale: a.locale,
      finished_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}
