import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Question } from "@/lib/test-engine";
import { getDirections, loadFixture, useFixture } from "./content";

// Savollar faqat server orqali o'qiladi: anon jadvalni umuman ko'ra olmaydi (correct_key himoyasi).
export async function getQuestionBank(bankSlug: string): Promise<Question[]> {
  const direction = (await getDirections()).find((d) => d.slug === bankSlug);
  if (!direction) return [];
  if (useFixture) {
    return (await loadFixture()).test_questions.filter(
      (q) => q.direction_id === direction.id,
    ) as unknown as Question[];
  }
  const { data, error } = await supabaseAdmin()
    .from("test_questions")
    .select("id, level, question, options, correct_key, sort")
    .eq("direction_id", direction.id)
    .eq("is_active", true);
  if (error) throw new Error(error.message);
  return data as unknown as Question[];
}

export async function getQuestionsByIds(bankSlug: string, ids: string[]): Promise<Question[]> {
  const bank = await getQuestionBank(bankSlug);
  const byId = new Map(bank.map((q) => [q.id, q]));
  return ids.map((id) => byId.get(id)).filter((q): q is Question => Boolean(q));
}
