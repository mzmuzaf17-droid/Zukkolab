import "server-only";
import { cache } from "react";
import { brand } from "@/brand.config";
import { supabasePublic } from "@/lib/supabase/public";
import type { Tables } from "@/lib/supabase/types";

export type Direction = Tables<"directions">;
export type Branch = Tables<"branches">;
export type Course = Tables<"courses">;
export type Teacher = Tables<"teachers">;
export type Faq = Tables<"faq">;
export type Testimonial = Tables<"testimonials">;
export type Group = Tables<"groups">;

type Strip<T> = Omit<T, "created_at" | "updated_at">;
type FixtureGroup = Omit<Strip<Group>, "start_date"> & { start_in_days: number };
type Fixture = {
  directions: Strip<Direction>[];
  branches: Strip<Branch>[];
  courses: Strip<Course>[];
  teachers: Strip<Teacher>[];
  faq: Strip<Faq>[];
  testimonials: Strip<Testimonial>[];
  groups: FixtureGroup[];
};

// DATA_SOURCE=fixture — faqat lokal ishlab chiqish uchun (Supabase'ga tarmoq yo'q bo'lsa).
const useFixture = process.env.DATA_SOURCE === "fixture";

export function todayInTashkent(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: brand.timeZone }).format(new Date());
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const loadFixture = cache(async (): Promise<Fixture> => {
  const mod = await import("./fixtures/content.json");
  return mod.default as unknown as Fixture;
});

function withTimestamps<T>(rows: T[]): (T & { created_at: string; updated_at: string })[] {
  return rows.map((r) => ({ ...r, created_at: "", updated_at: "" }));
}

function unwrap<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}

export const getDirections = cache(async (): Promise<Direction[]> => {
  if (useFixture) return withTimestamps((await loadFixture()).directions);
  return unwrap(await supabasePublic().from("directions").select("*").eq("is_active", true).order("sort"));
});

export const getBranches = cache(async (): Promise<Branch[]> => {
  if (useFixture) return withTimestamps((await loadFixture()).branches);
  return unwrap(await supabasePublic().from("branches").select("*").eq("is_active", true).order("sort"));
});

export const getCourses = cache(async (): Promise<Course[]> => {
  if (useFixture) return withTimestamps((await loadFixture()).courses);
  return unwrap(await supabasePublic().from("courses").select("*").eq("is_active", true).order("sort"));
});

export const getTeachers = cache(async (): Promise<Teacher[]> => {
  if (useFixture) return withTimestamps((await loadFixture()).teachers);
  return unwrap(await supabasePublic().from("teachers").select("*").eq("is_active", true).order("sort"));
});

export const getFaq = cache(async (): Promise<Faq[]> => {
  if (useFixture) return withTimestamps((await loadFixture()).faq);
  return unwrap(await supabasePublic().from("faq").select("*").eq("is_active", true).order("sort"));
});

export const getTestimonials = cache(async (): Promise<Testimonial[]> => {
  if (useFixture) return withTimestamps((await loadFixture()).testimonials);
  return unwrap(await supabasePublic().from("testimonials").select("*").eq("is_active", true).order("sort"));
});

// Ochiq, hali boshlanmagan guruhlar — boshlanish sanasi bo'yicha.
export const getOpenGroups = cache(async (): Promise<Group[]> => {
  const today = todayInTashkent();
  if (useFixture) {
    const { groups } = await loadFixture();
    return withTimestamps(
      groups.map(({ start_in_days, ...g }) => ({ ...g, start_date: addDays(today, start_in_days) })),
    ).sort((a, b) => a.start_date.localeCompare(b.start_date));
  }
  return unwrap(
    await supabasePublic()
      .from("groups")
      .select("*")
      .eq("is_open", true)
      .gte("start_date", today)
      .order("start_date"),
  );
});

export function seatsLeft(group: Pick<Group, "capacity" | "enrolled_count">): number {
  return Math.max(group.capacity - group.enrolled_count, 0);
}

// Kurs kartasidagi "Keyingi guruh: 14-oktabr · 3 joy qoldi" — joyi bor eng yaqin guruh.
export function nextGroupFor(courseId: string, groups: Group[]): Group | undefined {
  return groups.find((g) => g.course_id === courseId && seatsLeft(g) > 0);
}
