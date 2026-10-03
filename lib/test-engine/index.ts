// Daraja testi mantiqi (6-bo'lim). Sof funksiyalar — server va unit-testlar uchun.

export type QuestionText = { uz: string; ru: string; en: string };
export type QuestionOption = { key: string; text: QuestionText; scores?: Record<string, number> };
export type Question = {
  id: string;
  level: number;
  question: QuestionText;
  options: QuestionOption[];
  correct_key: string | null;
  sort: number;
};

export const LEVELS = [1, 2, 3, 4] as const;
export const PER_LEVEL = 3;
export const PASS_PER_LEVEL = 2;

// Qaysi yo'nalish qaysi savollar bankidan foydalanadi; abituriyent — matematika testi.
export function questionBankFor(directionSlug: string): string {
  return directionSlug === "abiturient" ? "math" : directionSlug;
}

export function isInterestTest(directionSlug: string): boolean {
  return directionSlug === "it";
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Har urinishda har daraja blokidan 3 tadan tasodifiy savol; bloklar osondan qiyinga.
export function pickQuestions(
  bank: Question[],
  interest: boolean,
  random: () => number = Math.random,
): Question[] {
  if (interest) return [...bank].sort((a, b) => a.sort - b.sort);
  return LEVELS.flatMap((level) =>
    shuffle(
      bank.filter((q) => q.level === level),
      random,
    ).slice(0, PER_LEVEL),
  );
}

// Brauzerga ketadigan ko'rinish: to'g'ri javob va ballar yo'q.
export function toPublicQuestion(q: Question) {
  return {
    id: q.id,
    question: q.question,
    options: q.options.map(({ key, text }) => ({ key, text })),
  };
}
export type PublicQuestion = ReturnType<typeof toPublicQuestion>;

export type LevelResult = {
  score: number;
  maxScore: number;
  level: number;
  perLevel: Record<number, number>;
};

// Natija — eng yuqori blok, unda va undan pastdagi barcha bloklarda kamida 3 dan 2 to'g'ri.
// Birinchi blokdan ham o'tolmasa — eng past daraja (1).
export function scoreLevelTest(questions: Question[], answers: Record<string, string>): LevelResult {
  const perLevel: Record<number, number> = {};
  let score = 0;
  for (const q of questions) {
    const ok = answers[q.id] !== undefined && answers[q.id] === q.correct_key;
    perLevel[q.level] = (perLevel[q.level] ?? 0) + (ok ? 1 : 0);
    if (ok) score++;
  }
  let level = 1;
  for (const l of LEVELS) {
    if ((perLevel[l] ?? 0) >= PASS_PER_LEVEL) level = l;
    else break;
  }
  return { score, maxScore: questions.length, level, perLevel };
}

export const IT_TRACKS = ["frontend", "backend", "design", "python_kids"] as const;
export type ItTrack = (typeof IT_TRACKS)[number];

export const IT_TRACK_COURSE: Record<ItTrack, string> = {
  frontend: "frontend",
  backend: "backend-python",
  design: "ui-ux-design",
  python_kids: "python-kids",
};

// IT qiziqish testi: har javob yo'nalishlarga ball beradi; eng ko'p ball olgan yo'nalish.
export function scoreInterestTest(questions: Question[], answers: Record<string, string>) {
  const totals: Record<ItTrack, number> = { frontend: 0, backend: 0, design: 0, python_kids: 0 };
  for (const q of questions) {
    const opt = q.options.find((o) => o.key === answers[q.id]);
    for (const [track, pts] of Object.entries(opt?.scores ?? {})) {
      if (track in totals) totals[track as ItTrack] += pts;
    }
  }
  const track = IT_TRACKS.reduce((best, t) => (totals[t] > totals[best] ? t : best), IT_TRACKS[0]);
  return { track, totals };
}

type CourseLite = {
  id: string;
  slug: string;
  direction_id: string;
  level_from: number;
  level_to: number;
  sort: number;
};
type GroupLite = { course_id: string; start_date: string; capacity: number; enrolled_count: number };

// Tavsiya: shu yo'nalishda level_from ≤ natija ≤ level_to; bir nechta bo'lsa — eng yaqin ochiladigan guruhi bori.
export function recommendCourse<C extends CourseLite>(
  courses: C[],
  groups: GroupLite[],
  directionId: string,
  level: number,
): C | undefined {
  const inDirection = courses.filter((c) => c.direction_id === directionId);
  const matching = inDirection.filter((c) => c.level_from <= level && level <= c.level_to);
  const pool = matching.length ? matching : inDirection;
  const nextStart = (c: C) =>
    groups
      .filter((g) => g.course_id === c.id && g.capacity > g.enrolled_count)
      .map((g) => g.start_date)
      .sort()[0] ?? "9999-12-31";
  return [...pool].sort((a, b) => nextStart(a).localeCompare(nextStart(b)) || a.sort - b.sort)[0];
}
