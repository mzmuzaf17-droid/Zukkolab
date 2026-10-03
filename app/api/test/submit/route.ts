import { NextResponse } from "next/server";
import { apiError, fieldErrors, localeFrom } from "@/lib/api";
import { getCourses, getDirections, getOpenGroups, nextGroupFor, seatsLeft } from "@/lib/data/content";
import { saveTestAttempt } from "@/lib/data/leads";
import { getQuestionsByIds } from "@/lib/data/questions";
import { pick } from "@/lib/i18n/pick";
import { testSubmitSchema } from "@/lib/schemas/lead";
import {
  IT_TRACK_COURSE,
  isInterestTest,
  questionBankFor,
  recommendCourse,
  scoreInterestTest,
  scoreLevelTest,
} from "@/lib/test-engine";
import { verifyAttemptToken } from "@/lib/test-engine/token";

// POST /api/test/submit — to'g'ri javoblar faqat shu yerda tekshiriladi.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const locale = localeFrom(body?.locale);
  const parsed = testSubmitSchema.safeParse(body);
  if (!parsed.success) return apiError("VALIDATION_ERROR", locale, { fields: fieldErrors(parsed.error) });

  const token = verifyAttemptToken(parsed.data.attemptToken);
  if (!token) return apiError("VALIDATION_ERROR", locale, { fields: { attemptToken: "expired" } });

  const [directions, courses, groups] = await Promise.all([getDirections(), getCourses(), getOpenGroups()]);
  const direction = directions.find((d) => d.slug === token.d);
  if (!direction) return apiError("NOT_FOUND", locale);

  const questions = await getQuestionsByIds(questionBankFor(token.d), token.q);
  // Faqat token'dagi savollarga berilgan javoblar hisobga olinadi.
  const answers = Object.fromEntries(
    Object.entries(parsed.data.answers).filter(([id]) => token.q.includes(id)),
  );

  let level: number | null = null;
  let track: string | null = null;
  let score = 0;
  let maxScore = questions.length;
  let course;
  if (isInterestTest(token.d)) {
    track = scoreInterestTest(questions, answers).track;
    course = courses.find((c) => c.slug === IT_TRACK_COURSE[track as keyof typeof IT_TRACK_COURSE]);
    maxScore = 0;
  } else {
    const r = scoreLevelTest(questions, answers);
    ({ level, score } = r);
    course = recommendCourse(courses, groups, direction.id, r.level);
  }

  const attemptId = await saveTestAttempt({
    directionId: direction.id,
    sessionId: token.s,
    questionIds: token.q,
    answers,
    score,
    maxScore,
    level,
    track,
    recommendedCourseId: course?.id ?? null,
    locale,
  });

  const next = course ? nextGroupFor(course.id, groups) : undefined;
  return NextResponse.json(
    {
      attemptId,
      direction: token.d,
      kind: track ? "interest" : "level",
      level,
      track,
      score,
      maxScore,
      course: course
        ? {
            slug: course.slug,
            title: pick(course, "title", locale),
            priceMonthly: course.price_monthly,
            nextGroup: next ? { startDate: next.start_date, seatsLeft: seatsLeft(next) } : null,
          }
        : null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
