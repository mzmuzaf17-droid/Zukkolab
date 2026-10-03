import { ArrowRight } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { seatsLeft, type Course, type Direction, type Group } from "@/lib/data/content";
import { formatAmount, formatDay } from "@/lib/format";
import { Link } from "@/lib/i18n/navigation";
import { pick } from "@/lib/i18n/pick";
import type { Locale } from "@/lib/i18n/routing";
import { textOn } from "@/lib/utils";
import { DirectionIcon } from "./direction-icon";

export async function CourseCard({
  course,
  direction,
  nextGroup,
}: {
  course: Course;
  direction: Direction | undefined;
  nextGroup: Group | undefined;
}) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("course");
  const seats = nextGroup ? seatsLeft(nextGroup) : 0;

  return (
    <Link
      href={`/kurslar/${course.slug}`}
      className="group border-line flex h-full flex-col gap-4 rounded-[20px] border bg-white p-5 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_rgb(20_18_31/0.25)]"
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className="inline-flex size-10 items-center justify-center rounded-xl"
          style={{
            backgroundColor: direction?.color ?? "var(--color-brand)",
            color: textOn(direction?.color),
          }}
        >
          <DirectionIcon name={direction?.icon ?? ""} className="size-5" />
        </span>
        <Badge>{t(`age.${course.age_group}`)}</Badge>
      </div>
      <div className="space-y-2">
        <h3 className="font-display text-lg leading-snug font-semibold">{pick(course, "title", locale)}</h3>
        <p className="text-muted line-clamp-2 text-sm">{pick(course, "description", locale)}</p>
      </div>
      <div className="mt-auto space-y-3">
        {nextGroup && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-ink/80">
              {t("nextGroup", { date: formatDay(nextGroup.start_date, locale) })}
            </span>
            {seats <= 3 && <Badge tone="coral">{t("seatsLeft", { count: seats })}</Badge>}
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold">
            {t("perMonth", { price: formatAmount(course.price_monthly, locale) })}
          </span>
          <ArrowRight
            className="text-brand size-5 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </div>
      </div>
    </Link>
  );
}
