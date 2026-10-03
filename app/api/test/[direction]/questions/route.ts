import { NextResponse } from "next/server";
import { apiError, localeFrom } from "@/lib/api";
import { getDirections } from "@/lib/data/content";
import { getQuestionBank } from "@/lib/data/questions";
import { isInterestTest, pickQuestions, questionBankFor, toPublicQuestion } from "@/lib/test-engine";
import { createAttemptToken } from "@/lib/test-engine/token";

export const dynamic = "force-dynamic";

// GET /api/test/[direction]/questions — 12 savol (correct_key'siz) + imzolangan attemptToken.
export async function GET(req: Request, ctx: RouteContext<"/api/test/[direction]/questions">) {
  const { direction: slug } = await ctx.params;
  const url = new URL(req.url);
  const locale = localeFrom(url.searchParams.get("locale"));
  const sessionId = (url.searchParams.get("session") ?? "").slice(0, 64) || crypto.randomUUID();

  const direction = (await getDirections()).find((d) => d.slug === slug && d.has_test);
  if (!direction) return apiError("NOT_FOUND", locale);

  const interest = isInterestTest(slug);
  const questions = pickQuestions(await getQuestionBank(questionBankFor(slug)), interest);
  if (questions.length === 0) return apiError("NOT_FOUND", locale);

  return NextResponse.json(
    {
      attemptToken: createAttemptToken(
        slug,
        questions.map((q) => q.id),
        sessionId,
      ),
      kind: interest ? "interest" : "level",
      questions: questions.map(toPublicQuestion),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
