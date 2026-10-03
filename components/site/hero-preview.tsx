import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { seatsLeft, type Course, type Group } from "@/lib/data/content";
import { formatAmount, formatDay } from "@/lib/format";
import { pick } from "@/lib/i18n/pick";
import type { Locale } from "@/lib/i18n/routing";

// Hero o'ng tomoni: test natijasi qanday ko'rinishini oldindan ko'rsatadi (faqat katta ekranda).
export async function HeroPreview({
  course,
  nextGroup,
  locale,
}: {
  course: Course;
  nextGroup: Group | undefined;
  locale: Locale;
}) {
  const t = await getTranslations("home.preview");
  const tc = await getTranslations("course");
  const seats = nextGroup ? seatsLeft(nextGroup) : 0;

  return (
    <div aria-hidden className="relative hidden lg:block">
      <div className="bg-cta font-display absolute -top-4 -right-3 rotate-6 rounded-2xl px-4 py-2 text-2xl font-bold shadow-sm">
        B1
      </div>
      <div className="border-line space-y-5 rounded-[24px] border bg-white p-6 shadow-[0_24px_48px_-24px_rgb(20_18_31/0.25)]">
        <p className="text-muted text-xs font-semibold tracking-wide uppercase">{t("label")}</p>
        <div>
          <p className="text-muted text-sm">{t("level")}</p>
          <p className="font-display text-4xl font-bold">B1</p>
          <p className="text-muted mt-1 text-sm">{t("score", { score: 9, max: 12 })}</p>
          <div className="bg-ink/5 mt-3 h-2 overflow-hidden rounded-full">
            <div className="bg-brand h-full w-3/4 rounded-full" />
          </div>
        </div>
        <div className="bg-bg space-y-2 rounded-2xl p-4">
          <p className="text-muted text-xs">{t("recommended")}</p>
          <p className="font-semibold">{pick(course, "title", locale)}</p>
          <p className="text-sm">{tc("perMonth", { price: formatAmount(course.price_monthly, locale) })}</p>
          {nextGroup && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-ink/80">
                {tc("nextGroup", { date: formatDay(nextGroup.start_date, locale) })}
              </span>
              {seats <= 3 && <Badge tone="coral">{tc("seatsLeft", { count: seats })}</Badge>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
