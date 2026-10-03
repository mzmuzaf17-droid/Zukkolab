import { describe, expect, it } from "vitest";
import {
  pickQuestions,
  recommendCourse,
  scoreInterestTest,
  scoreLevelTest,
  toPublicQuestion,
  type Question,
} from "@/lib/test-engine";
import { createAttemptToken, verifyAttemptToken } from "@/lib/test-engine/token";

const t = (s: string) => ({ uz: s, ru: s, en: s });
const bank: Question[] = [1, 2, 3, 4].flatMap((level) =>
  [0, 1, 2, 3, 4].map((i) => ({
    id: `q${level}${i}`,
    level,
    question: t(`L${level} Q${i}`),
    options: ["a", "b", "c", "d"].map((key) => ({ key, text: t(key) })),
    correct_key: "a",
    sort: level * 10 + i,
  })),
);

function answer(questions: Question[], correctPerLevel: Record<number, number>) {
  const left = { ...correctPerLevel };
  return Object.fromEntries(
    questions.map((q) => {
      const ok = (left[q.level] ?? 0) > 0;
      if (ok) left[q.level]--;
      return [q.id, ok ? "a" : "b"];
    }),
  );
}

describe("pickQuestions", () => {
  it("takes 3 questions per level, easiest first", () => {
    const qs = pickQuestions(bank, false);
    expect(qs).toHaveLength(12);
    expect(qs.map((q) => q.level)).toEqual([1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4]);
    expect(new Set(qs.map((q) => q.id)).size).toBe(12);
  });

  it("never exposes the correct answer", () => {
    expect(JSON.stringify(toPublicQuestion(bank[0]))).not.toContain("correct_key");
  });
});

describe("scoreLevelTest", () => {
  const qs = pickQuestions(bank, false);

  it.each([
    [{ 1: 3, 2: 3, 3: 2, 4: 1 }, 3],
    [{ 1: 2, 2: 2, 3: 2, 4: 2 }, 4],
    [{ 1: 3, 2: 1, 3: 3, 4: 3 }, 1], // 2-blokdan o'tmadi — yuqori bloklar hisobga olinmaydi
    [{ 1: 1, 2: 3, 3: 3, 4: 3 }, 1], // birinchi blokdan o'tmadi — eng past daraja
    [{ 1: 3, 2: 2, 3: 0, 4: 3 }, 2],
  ])("%o → level %i", (correct, level) => {
    const r = scoreLevelTest(qs, answer(qs, correct));
    expect(r.level).toBe(level);
    expect(r.maxScore).toBe(12);
  });

  it("ignores answers for unknown questions", () => {
    expect(scoreLevelTest(qs, { foreign: "a" }).score).toBe(0);
  });
});

describe("scoreInterestTest", () => {
  it("picks the track with most points", () => {
    const q: Question = {
      id: "i1",
      level: 1,
      sort: 1,
      correct_key: null,
      question: t("?"),
      options: [
        { key: "a", text: t("a"), scores: { design: 3 } },
        { key: "b", text: t("b"), scores: { backend: 2 } },
      ],
    };
    expect(scoreInterestTest([q], { i1: "a" }).track).toBe("design");
    expect(scoreInterestTest([q], { i1: "b" }).track).toBe("backend");
  });
});

describe("recommendCourse", () => {
  const courses = [
    { id: "kids", slug: "kids", direction_id: "en", level_from: 1, level_to: 2, sort: 1 },
    { id: "general", slug: "general", direction_id: "en", level_from: 1, level_to: 3, sort: 2 },
    { id: "ielts", slug: "ielts", direction_id: "en", level_from: 2, level_to: 4, sort: 3 },
  ];
  const groups = [
    { course_id: "general", start_date: "2026-10-20", capacity: 12, enrolled_count: 5 },
    { course_id: "ielts", start_date: "2026-10-09", capacity: 12, enrolled_count: 9 },
    { course_id: "kids", start_date: "2026-10-05", capacity: 12, enrolled_count: 12 },
  ];

  it("chooses the matching course with the nearest open group", () => {
    expect(recommendCourse(courses, groups, "en", 3)?.slug).toBe("ielts");
    expect(recommendCourse(courses, groups, "en", 1)?.slug).toBe("general"); // kids guruhi to'la
    expect(recommendCourse(courses, groups, "en", 4)?.slug).toBe("ielts");
  });
});

describe("attempt token", () => {
  it("round-trips and rejects tampering and expiry", () => {
    const token = createAttemptToken("english", ["a", "b"], "s1", 1000);
    expect(verifyAttemptToken(token, 2000)?.q).toEqual(["a", "b"]);
    const [data] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ d: "english", q: ["x"], s: "s1", exp: 9e15 })).toString(
      "base64url",
    );
    expect(verifyAttemptToken(`${forged}.${token.split(".")[1]}`, 2000)).toBeNull();
    expect(verifyAttemptToken(`${data}.bad`, 2000)).toBeNull();
    expect(verifyAttemptToken(token, 1000 + 31 * 60 * 1000)).toBeNull();
  });
});
