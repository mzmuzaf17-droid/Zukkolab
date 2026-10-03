"use client";

import { ArrowLeft, CalendarCheck, RotateCcw, Share2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { formatAmount, formatDay } from "@/lib/format";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import type { PublicQuestion } from "@/lib/test-engine";
import { cn } from "@/lib/utils";

type Result = {
  attemptId: string;
  direction: string;
  kind: "level" | "interest";
  level: number | null;
  track: string | null;
  score: number;
  maxScore: number;
  course: {
    slug: string;
    title: string;
    priceMonthly: number;
    nextGroup: { startDate: string; seatsLeft: number } | null;
  } | null;
};

type State =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "answering"; token: string; questions: PublicQuestion[]; index: number }
  | { kind: "submitting" }
  | { kind: "done"; result: Result };

// Bir ekranda bitta savol, progress chizig'i, "Orqaga" bor, taymer yo'q (6-bo'lim).
// Javoblar faqat brauzerda; tashlab ketilsa — hech narsa saqlanmaydi.
export function LevelTest({
  directionSlug,
  levelNames,
  languageTest,
}: {
  directionSlug: string;
  levelNames: string[] | null;
  languageTest: boolean;
}) {
  const t = useTranslations("test");
  const tc = useTranslations("course");
  const locale = useLocale() as Locale;
  const [state, setState] = useState<State>({ kind: "loading" });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    setAnswers({});
    try {
      const session = crypto.randomUUID();
      const res = await fetch(`/api/test/${directionSlug}/questions?locale=${locale}&session=${session}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { attemptToken: string; questions: PublicQuestion[] };
      setState({ kind: "answering", token: data.attemptToken, questions: data.questions, index: 0 });
    } catch {
      setState({ kind: "error" });
    }
  }, [directionSlug, locale]);

  useEffect(() => {
    // Sahifa ochilganda savollarni yuklash — tashqi tizim bilan sinxronlash.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function submit(token: string, final: Record<string, string>) {
    setState({ kind: "submitting" });
    try {
      const res = await fetch("/api/test/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptToken: token, answers: final, locale }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setState({ kind: "done", result: (await res.json()) as Result });
      window.scrollTo({ top: 0 });
    } catch {
      setState({ kind: "error" });
    }
  }

  if (state.kind === "loading" || state.kind === "submitting") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center" role="status" aria-live="polite">
        <p className="text-muted animate-pulse font-semibold">
          {state.kind === "loading" ? t("loading") : t("submitting")}
        </p>
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="border-line space-y-4 rounded-[20px] border bg-white p-6 text-center" role="alert">
        <p className="font-semibold">{t("loadError")}</p>
        <button type="button" onClick={load} className={buttonClass("secondary")}>
          <RotateCcw className="size-4" aria-hidden />
          {t("retry")}
        </button>
      </div>
    );
  }

  if (state.kind === "answering") {
    const { questions, index, token } = state;
    const q = questions[index];
    const isLast = index === questions.length - 1;
    const chosen = answers[q.id];

    const choose = (key: string) => {
      const next = { ...answers, [q.id]: key };
      setAnswers(next);
      if (!isLast) setTimeout(() => setState({ ...state, index: index + 1 }), 180);
    };

    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="text-muted flex items-center justify-between text-sm font-semibold">
            <span>{t("progress", { current: index + 1, total: questions.length })}</span>
            {languageTest && <span>{t("langNote")}</span>}
          </div>
          <div
            className="bg-ink/5 h-2 overflow-hidden rounded-full"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={questions.length}
            aria-valuenow={index + 1}
          >
            <div
              className="bg-brand h-full rounded-full transition-[width] duration-200"
              style={{ width: `${((index + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <fieldset className="space-y-4">
          <legend className="font-display mb-4 text-2xl leading-snug font-semibold md:text-[28px]">
            {q.question[locale]}
          </legend>
          <div className="grid gap-3">
            {q.options.map((o) => (
              <button
                key={o.key}
                type="button"
                onClick={() => choose(o.key)}
                aria-pressed={chosen === o.key}
                className={cn(
                  "flex min-h-14 items-center gap-3 rounded-[14px] border-2 bg-white px-4 py-3 text-left text-base font-medium transition-colors",
                  chosen === o.key ? "border-brand bg-brand/5" : "border-line hover:border-ink/30",
                )}
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold uppercase",
                    chosen === o.key ? "bg-brand text-white" : "bg-ink/5",
                  )}
                >
                  {o.key}
                </span>
                {o.text[locale]}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setState({ ...state, index: index - 1 })}
            disabled={index === 0}
            className={buttonClass("ghost", "md", "disabled:opacity-40")}
          >
            <ArrowLeft className="size-4" aria-hidden />
            {t("back")}
          </button>
          {isLast && (
            <button
              type="button"
              disabled={!chosen}
              onClick={() => submit(token, answers)}
              className={buttonClass("primary", "md", "disabled:opacity-40")}
            >
              {t("finish")}
            </button>
          )}
        </div>
      </div>
    );
  }

  const { result } = state;
  const label =
    result.kind === "interest"
      ? t(`tracks.${result.track as "frontend"}`)
      : levelNames && result.level
        ? levelNames[result.level - 1]
        : String(result.level ?? "");
  const explanation =
    result.kind === "interest" ? t("trackText") : (t.raw("explain") as string[])[(result.level ?? 1) - 1];
  const shareUrl = `${window.location.origin}/${locale}/test/${result.direction}?ref=${result.attemptId}`;

  async function share() {
    const text = t("shareText", { level: label });
    if (navigator.share) {
      await navigator.share({ title: "Zukkolab", text, url: shareUrl }).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(`${text} ${shareUrl}`);
    setCopied(true);
  }

  return (
    <div className="space-y-6" aria-live="polite">
      <div className="bg-ink rounded-[24px] p-6 text-white md:p-8">
        <p className="text-sm font-semibold text-white/60">
          {result.kind === "interest" ? t("interestTitle") : t("resultTitle")}
        </p>
        <p className="font-display mt-2 text-[40px] leading-tight font-bold md:text-[56px]">
          <span className="bg-cta text-ink inline-block -rotate-2 rounded-xl px-3">{label}</span>
        </p>
        {result.kind === "level" && (
          <p className="mt-3 text-white/70">{t("score", { score: result.score, max: result.maxScore })}</p>
        )}
        <p className="mt-4 max-w-xl text-lg text-white/90">{explanation}</p>
      </div>

      {result.course && (
        <div className="border-line space-y-4 rounded-[20px] border bg-white p-5">
          <p className="text-muted text-sm font-semibold">{t("recommended")}</p>
          <Link
            href={`/kurslar/${result.course.slug}`}
            className="font-display block text-xl font-semibold hover:underline"
          >
            {result.course.title}
          </Link>
          <p className="font-semibold">
            {tc("perMonth", { price: formatAmount(result.course.priceMonthly, locale) })}
          </p>
          {result.course.nextGroup && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span>{tc("nextGroup", { date: formatDay(result.course.nextGroup.startDate, locale) })}</span>
              {result.course.nextGroup.seatsLeft <= 3 && (
                <Badge tone="coral">{tc("seatsLeft", { count: result.course.nextGroup.seatsLeft })}</Badge>
              )}
            </div>
          )}
          <Link
            href={{
              pathname: "/sinov-darsi",
              query: { direction: result.direction, course: result.course.slug, attempt: result.attemptId },
            }}
            className={buttonClass("primary", "lg", "w-full")}
          >
            <CalendarCheck className="size-5" aria-hidden />
            {t("bookThis")}
          </Link>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={share} className={buttonClass("secondary")}>
          <Share2 className="size-4" aria-hidden />
          {copied ? t("copied") : t("share")}
        </button>
        <button type="button" onClick={load} className={buttonClass("ghost")}>
          <RotateCcw className="size-4" aria-hidden />
          {t("retake")}
        </button>
        <Link href="/test" className={buttonClass("ghost")}>
          {t("other")}
        </Link>
      </div>
    </div>
  );
}
