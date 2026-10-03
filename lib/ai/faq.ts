import { createTranslator } from "next-intl";
import { formatAmount } from "@/lib/format";
import { pick } from "@/lib/i18n/pick";
import type { Locale } from "@/lib/i18n/routing";
import en from "@/messages/en.json";
import ru from "@/messages/ru.json";
import uz from "@/messages/uz.json";
import type { AiContext, AiKnowledge, AiProvider, AiReply, ChatMessage } from "./types";

// faq rejimi (9-bo'lim): kalitsiz, bepul, hech qachon xato bermaydi. Bilim bazasi kichik (≈10 FAQ, 12 kurs,
// 3 filial), shuning uchun qidiruv xotirada: niyat qoidalari + trigram o'xshashligi (pg_trgm bilan bir xil g'oya).

const messages = { uz, ru, en } as const;
const aiT = (locale: Locale) => createTranslator({ locale, messages: messages[locale], namespace: "ai" });

export function normalize(s: string): string {
  return s
    .normalize("NFKC")
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[ʻʼ'’‘`]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function trigrams(s: string): Set<string> {
  const out = new Set<string>();
  for (const w of normalize(s).split(" ")) {
    if (!w) continue;
    const p = `  ${w} `;
    for (let i = 0; i < p.length - 2; i++) out.add(p.slice(i, i + 3));
  }
  return out;
}

// Dice koeffitsienti: 0..1.
export function similarity(a: string, b: string): number {
  const A = trigrams(a);
  const B = trigrams(b);
  if (!A.size || !B.size) return 0;
  let common = 0;
  for (const g of A) if (B.has(g)) common++;
  return (2 * common) / (A.size + B.size);
}

// Foydalanuvchi qaysi tilda yozsa, shu tilda javob (9-bo'lim). Kirill → ru; inglizcha so'zlar → en; aks holda uz.
export function detectLanguage(text: string, fallback: Locale): Locale {
  if (/[а-яё]/i.test(text)) return "ru";
  const words = normalize(text).split(" ");
  const enWords = [
    "what",
    "how",
    "much",
    "the",
    "is",
    "are",
    "do",
    "does",
    "for",
    "which",
    "price",
    "course",
    "old",
    "you",
    "where",
    "can",
  ];
  if (words.filter((w) => enWords.includes(w)).length >= 2) return "en";
  if (fallback === "en" && words.some((w) => enWords.includes(w))) return "en";
  return fallback === "ru" ? "uz" : fallback;
}

const has = (text: string, stems: string[]) => {
  const n = ` ${normalize(text)}`;
  return stems.some((s) => n.includes(` ${s}`));
};

// Yo'nalish va aniq kurs kalit so'zlari (o'zak bo'yicha, uch tilda).
const DIRECTION_STEMS: Record<string, string[]> = {
  english: ["ingliz", "english", "английск", "англ", "ielts"],
  russian: ["rus tili", "rus ", "russian", "русск"],
  math: ["matem", "математ", "math", "olimpiad", "олимпиад"],
  it: ["python", "frontend", "backend", "dizayn", "design", "дизайн", "dastur", "программ", "it ", "айти"],
  abiturient: ["abituriyent", "абитуриент", "dtm", "дтм"],
};
const COURSE_STEMS: Record<string, string[]> = {
  "ielts-intensive": ["ielts"],
  "math-olympiad": ["olimpiad", "олимпиад", "olympiad"],
  "abiturient-dtm": ["dtm", "дтм"],
  frontend: ["frontend", "фронтенд"],
  "backend-python": ["backend", "бэкенд", "django"],
  "ui-ux-design": ["dizayn", "design", "дизайн", "ui ux", "figma"],
};
const BRANCH_STEMS = [
  "filial",
  "manzil",
  "qayerda",
  "yaqin",
  "филиал",
  "адрес",
  "где",
  "ближ",
  "branch",
  "address",
  "where",
  "closest",
  "near",
];
const GREETING_STEMS = ["salom", "assalom", "привет", "здравств", "добрый", "hello", "hi", "hey"];
const TEST_STEMS = ["daraja", "uroven", "уровен", "level", "test", "тест"];

const ageGroupFor = (age: number) => (age <= 11 ? "kids" : age <= 17 ? "teens" : "adults");

function mentionedDirection(text: string): string | null {
  for (const [slug, stems] of Object.entries(DIRECTION_STEMS)) if (has(text, stems)) return slug;
  return null;
}

function mentionedCourse(text: string): string | null {
  for (const [slug, stems] of Object.entries(COURSE_STEMS)) if (has(text, stems)) return slug;
  return null;
}

export function faqAnswer(message: string, k: AiKnowledge, locale: Locale): AiReply {
  const t = aiT(locale);
  const price = (n: number) => formatAmount(n, locale);
  const courseLine = (c: AiKnowledge["courses"][number]) =>
    `• ${t("courseLine", { title: pick(c, "title", locale), price: price(c.price_monthly) })}`;

  // 0) Salomlashish.
  if (normalize(message).split(" ").length <= 3 && has(message, GREETING_STEMS))
    return { text: t("intro"), cta: null };

  // 1) Yosh bo'yicha: "10 yoshli bolaga qaysi kurs?"
  const ageMatch = normalize(message).match(/(\d{1,2})\s*(yosh|ёш|лет|год|year|yo)/);
  if (ageMatch) {
    const age = Number(ageMatch[1]);
    if (age < 7) return { text: t("tooYoung"), cta: "operator" };
    const dirSlug = mentionedDirection(message);
    const dirId = k.directions.find((d) => d.slug === dirSlug)?.id;
    const list = k.courses
      .filter((c) => c.age_group === ageGroupFor(age) && (!dirId || c.direction_id === dirId))
      .slice(0, 5);
    if (list.length) {
      return {
        text: [t("forAge", { age }), ...list.map(courseLine), "", t("pickAfter")].join("\n"),
        cta: "trial",
      };
    }
  }

  // 2) Aniq kurs: "IELTS qancha?", "Frontend kursi necha oy?"
  const courseSlug = mentionedCourse(message);
  const course = courseSlug ? k.courses.find((c) => c.slug === courseSlug) : undefined;
  if (course) {
    return {
      text: t("courseInfo", {
        title: pick(course, "title", locale),
        lessons: course.lessons_per_week,
        minutes: course.lesson_minutes,
        months: course.duration_months,
        price: price(course.price_monthly),
      }),
      cta: "trial",
    };
  }

  // 3) Filiallar — manzillar bazadan, to'qimasdan.
  if (has(message, BRANCH_STEMS) && k.branches.length) {
    const lines = k.branches.map((b) => {
      const landmark = pick(b, "landmark", locale);
      const line = t("branchLine", { name: pick(b, "name", locale), address: pick(b, "address", locale) });
      return `• ${line}${landmark ? ` (${landmark})` : ""}`;
    });
    return { text: [t("branchesIntro"), ...lines, "", t("pickAfter")].join("\n"), cta: "trial" };
  }

  // 4) FAQ: savol barcha tillardagi variantlar bilan solishtiriladi, javob — foydalanuvchi tilida.
  let best: { score: number; item?: AiKnowledge["faq"][number] } = { score: 0 };
  for (const item of k.faq) {
    const score = Math.max(
      similarity(message, item.question_uz),
      similarity(message, item.question_ru),
      similarity(message, item.question_en),
    );
    if (score > best.score) best = { score, item };
  }
  const faqReply = (): AiReply => ({
    text: pick(best.item!, "answer", locale),
    cta: has(message, TEST_STEMS) ? "test" : "trial",
  });
  if (best.item && best.score >= 0.55) return faqReply();

  // 5) Yo'nalish tilga olingan bo'lsa — uning kurslari va daraja testi.
  const dirSlug = mentionedDirection(message);
  const dir = k.directions.find((d) => d.slug === dirSlug);
  if (dir) {
    const list = k.courses.filter((c) => c.direction_id === dir.id);
    if (list.length)
      return { text: list.map(courseLine).join("\n"), cta: dir.slug === "it" ? "trial" : "test" };
  }

  // 6) O'rtacha o'xshashlik — baribir FAQ (masalan, so'zlar boshqacha tartibda).
  if (best.item && best.score >= 0.32) return faqReply();

  return { text: t("unknown"), cta: "operator" };
}

export const faqProvider: AiProvider = {
  async reply(history: ChatMessage[], context: AiContext): Promise<AiReply> {
    const last = [...history].reverse().find((m) => m.role === "user")?.content ?? "";
    return faqAnswer(last, context.knowledge, detectLanguage(last, context.locale));
  },
};
