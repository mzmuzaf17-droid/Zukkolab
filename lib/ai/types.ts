import type { Branch, Course, Direction, Faq } from "@/lib/data/content";
import type { Locale } from "@/lib/i18n/routing";

// 9-bo'lim: AiProvider.reply(messages, context) → { text, cta }.
export type AiCta = "test" | "trial" | "operator" | null;
export type AiReply = { text: string; cta: AiCta };
export type ChatMessage = { role: "user" | "assistant"; content: string };

export type AiKnowledge = {
  courses: Pick<
    Course,
    | "slug"
    | "direction_id"
    | "age_group"
    | "price_monthly"
    | "lessons_per_week"
    | "lesson_minutes"
    | "duration_months"
    | "title_uz"
    | "title_ru"
    | "title_en"
  >[];
  directions: Pick<Direction, "id" | "slug" | "name_uz" | "name_ru" | "name_en">[];
  branches: Pick<
    Branch,
    | "name_uz"
    | "name_ru"
    | "name_en"
    | "address_uz"
    | "address_ru"
    | "address_en"
    | "landmark_uz"
    | "landmark_ru"
    | "landmark_en"
    | "working_hours_uz"
    | "working_hours_ru"
    | "working_hours_en"
    | "phone"
  >[];
  faq: Pick<Faq, "question_uz" | "question_ru" | "question_en" | "answer_uz" | "answer_ru" | "answer_en">[];
};

export type AiContext = { locale: Locale; knowledge: AiKnowledge };

export interface AiProvider {
  reply(messages: ChatMessage[], context: AiContext): Promise<AiReply>;
}
