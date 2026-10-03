import { anyT } from "@/lib/telegram/i18n";
import { getDirections, useFixture } from "@/lib/data/content";
import { pick } from "@/lib/i18n/pick";
import { isLocale, type Locale } from "@/lib/i18n/routing";
import { levelScale } from "@/lib/levels";
import { renderStory } from "@/lib/share/story";
import { supabaseAdmin } from "@/lib/supabase/admin";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Attempt = {
  direction: string;
  level: number | null;
  track: string | null;
  score: number | null;
  maxScore: number | null;
};

async function loadAttempt(id: string, params: URLSearchParams): Promise<Attempt | null> {
  if (useFixture) {
    // Dev rejimida urinishlar saqlanmaydi — natija so'rov parametrlaridan (faqat lokal ko'rish uchun).
    const n = (k: string) => (params.has(k) ? Number(params.get(k)) : null);
    return {
      direction: params.get("d") ?? "english",
      level: n("lv"),
      track: params.get("tr"),
      score: n("s"),
      maxScore: n("m"),
    };
  }
  const { data } = await supabaseAdmin()
    .from("test_attempts")
    .select("result_level, result_track, score, max_score, finished_at, directions(slug)")
    .eq("id", id)
    .maybeSingle();
  if (!data?.finished_at || !data.directions) return null;
  return {
    direction: data.directions.slug,
    level: data.result_level,
    track: data.result_track,
    score: data.score,
    maxScore: data.max_score,
  };
}

// GET /api/share/<attemptId>?l=uz — 1080×1920 PNG (v1.1, 4-qaror). Natija o'zgarmaydi — uzoq keshlanadi.
export async function GET(req: Request, ctx: RouteContext<"/api/share/[attemptId]">) {
  const { attemptId } = await ctx.params;
  const url = new URL(req.url);
  const l = url.searchParams.get("l");
  const locale: Locale = l && isLocale(l) ? l : "uz";
  if (!UUID.test(attemptId)) return new Response("Not found", { status: 404 });

  const attempt = await loadAttempt(attemptId, url.searchParams);
  const direction = attempt && (await getDirections()).find((d) => d.slug === attempt.direction);
  if (!attempt || !direction) return new Response("Not found", { status: 404 });

  const t = anyT(locale);
  const scale = levelScale(direction.slug);
  const isInterest = Boolean(attempt.track);
  const label = isInterest
    ? t(`test.tracks.${attempt.track as "frontend"}`)
    : scale && attempt.level
      ? (t.raw(`levels.${scale}`) as string[])[attempt.level - 1]
      : String(attempt.level ?? "");
  const explanation = isInterest
    ? t("test.trackText")
    : (t.raw("test.explain") as string[])[Math.min(Math.max((attempt.level ?? 1) - 1, 0), 3)];

  const image = await renderStory({
    kicker: t("test.storyKicker"),
    direction: pick(direction, "name", locale),
    label,
    score:
      !isInterest && attempt.maxScore
        ? t("test.score", { score: attempt.score ?? 0, max: attempt.maxScore })
        : null,
    explanation,
    challenge: t("test.storyChallenge"),
    free: t("test.storyFree"),
  });
  image.headers.set("Cache-Control", useFixture ? "no-store" : "public, max-age=31536000, immutable");
  return image;
}
