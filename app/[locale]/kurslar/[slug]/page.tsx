import { ArrowLeft, CalendarDays, Check, Clock, MapPin } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DirectionIcon } from "@/components/site/direction-icon";
import { TeacherCard } from "@/components/site/teacher-card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import {
  getBranches,
  getCourses,
  getDirections,
  getOpenGroups,
  getTeachers,
  seatsLeft,
} from "@/lib/data/content";
import { formatAmount, formatDay } from "@/lib/format";
import { Link } from "@/lib/i18n/navigation";
import { pick } from "@/lib/i18n/pick";
import type { Locale } from "@/lib/i18n/routing";
import { levelScale } from "@/lib/levels";

export const revalidate = 60;

export async function generateStaticParams() {
  const courses = await getCourses();
  return courses.map((c) => ({ slug: c.slug }));
}

async function findCourse(slug: string) {
  const courses = await getCourses();
  return courses.find((c) => c.slug === slug);
}

export async function generateMetadata({ params }: PageProps<"/[locale]/kurslar/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const course = await findCourse(slug);
  if (!course) return {};
  return {
    title: pick(course, "title", locale as Locale),
    description: pick(course, "description", locale as Locale),
  };
}

export default async function CoursePage({ params }: PageProps<"/[locale]/kurslar/[slug]">) {
  const { locale: raw, slug } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  const course = await findCourse(slug);
  if (!course) notFound();

  const tcta = await getTranslations("cta");
  const [t, tl, directions, groups, branches, teachers] = await Promise.all([
    getTranslations("course"),
    getTranslations("levels"),
    getDirections(),
    getOpenGroups(),
    getBranches(),
    getTeachers(),
  ]);
  const direction = directions.find((d) => d.id === course.direction_id);
  const branchById = new Map(branches.map((b) => [b.id, b]));
  const courseGroups = groups.filter((g) => g.course_id === course.id);
  const teacherIds = new Set(courseGroups.map((g) => g.teacher_id));
  const courseTeachers = teachers.filter((tc) => teacherIds.has(tc.id));
  const scale = direction ? levelScale(direction.slug) : null;
  const levelNames = scale ? (tl.raw(scale) as string[]) : null;
  const trialHref = {
    pathname: "/sinov-darsi" as const,
    query: { direction: direction?.slug ?? "", course: course.slug },
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:py-12">
      <Link
        href="/kurslar"
        className="text-muted hover:text-ink inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("back")}
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <header className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {direction && (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold text-white"
                  style={{ backgroundColor: direction.color }}
                >
                  <DirectionIcon name={direction.icon} className="size-3.5" />
                  {pick(direction, "name", locale)}
                </span>
              )}
              <Badge>{t(`age.${course.age_group}`)}</Badge>
              {levelNames && (
                <Badge tone="brand">
                  {course.level_from === course.level_to
                    ? t("level", { level: levelNames[course.level_from - 1] })
                    : t("levels", {
                        from: levelNames[course.level_from - 1],
                        to: levelNames[course.level_to - 1],
                      })}
                </Badge>
              )}
            </div>
            <h1 className="font-display text-[32px] leading-tight font-bold md:text-[48px]">
              {pick(course, "title", locale)}
            </h1>
            <p className="text-ink/80 max-w-2xl text-lg">{pick(course, "description", locale)}</p>
            <ul className="text-ink/80 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <li className="flex items-center gap-1.5">
                <CalendarDays className="text-brand size-4" aria-hidden />
                {t("duration", { months: course.duration_months })}
              </li>
              <li className="flex items-center gap-1.5">
                <Clock className="text-brand size-4" aria-hidden />
                {t("lessons", { count: course.lessons_per_week, minutes: course.lesson_minutes })}
              </li>
            </ul>
          </header>

          {/* Telefonda narx va asosiy tugma darhol ko'rinsin (katta ekranda o'ng ustunda). */}
          <div className="border-line flex items-center justify-between gap-3 rounded-[20px] border bg-white p-4 lg:hidden">
            <p className="font-semibold whitespace-nowrap">
              {t("perMonth", { price: formatAmount(course.price_monthly, locale) })}
            </p>
            <ButtonLink href={trialHref} size="sm">
              {tcta("trialShort")}
            </ButtonLink>
          </div>

          <section className="space-y-3">
            <h2 className="font-display text-2xl font-bold">{t("program")}</h2>
            <ol className="grid gap-2 sm:grid-cols-2">
              {pick(course, "program", locale).map((item, i) => (
                <li key={item} className="border-line flex items-start gap-3 rounded-2xl border bg-white p-4">
                  <span className="bg-brand/10 text-brand flex size-7 shrink-0 items-center justify-center rounded-lg text-sm font-bold">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{item}</span>
                </li>
              ))}
            </ol>
          </section>

          {/* FR-SITE-08: ochiladigan guruhlar; joy qolmasa — navbatga yozilish */}
          <section className="space-y-3">
            <h2 className="font-display text-2xl font-bold">{t("groups")}</h2>
            {courseGroups.length === 0 ? (
              <p className="text-muted">{t("groupsEmpty")}</p>
            ) : (
              <ul className="space-y-3">
                {courseGroups.map((g) => {
                  const seats = seatsLeft(g);
                  const branch = branchById.get(g.branch_id);
                  return (
                    <li
                      key={g.id}
                      className="border-line grid gap-3 rounded-2xl border bg-white p-4 sm:grid-cols-[1fr_auto] sm:items-center"
                    >
                      <div className="grid gap-1 text-sm sm:grid-cols-3 sm:gap-4">
                        <div>
                          <p className="text-muted text-xs">{t("start")}</p>
                          <p className="font-semibold">{formatDay(g.start_date, locale)}</p>
                        </div>
                        <div>
                          <p className="text-muted text-xs">{t("schedule")}</p>
                          <p className="font-semibold">{pick(g, "schedule_text", locale)}</p>
                        </div>
                        <div>
                          <p className="text-muted text-xs">{t("branch")}</p>
                          <p className="flex items-center gap-1 font-semibold">
                            <MapPin className="text-brand size-3.5" aria-hidden />
                            {branch ? pick(branch, "name", locale) : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 sm:justify-end">
                        {seats > 0 ? (
                          <Badge tone={seats <= 3 ? "coral" : "muted"}>
                            {t("seatsLeft", { count: seats })}
                          </Badge>
                        ) : (
                          <>
                            <Badge tone="ink">{t("full")}</Badge>
                            <ButtonLink href={trialHref} variant="secondary" size="sm">
                              {t("waitlist")}
                            </ButtonLink>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {courseTeachers.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-display text-2xl font-bold">{t("teacher")}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {courseTeachers.map((teacher) => (
                  <TeacherCard key={teacher.id} teacher={teacher} direction={direction} />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="border-line space-y-4 rounded-[20px] border bg-white p-5">
            <div>
              <p className="text-muted text-sm">{t("price")}</p>
              <p className="font-display text-2xl font-bold">
                {t("perMonth", { price: formatAmount(course.price_monthly, locale) })}
              </p>
            </div>
            <ul className="text-ink/80 space-y-2 text-sm">
              {[
                t("duration", { months: course.duration_months }),
                t("lessons", { count: course.lessons_per_week, minutes: course.lesson_minutes }),
              ].map((line) => (
                <li key={line} className="flex items-center gap-2">
                  <Check className="text-brand size-4" aria-hidden />
                  {line}
                </li>
              ))}
            </ul>
            <ButtonLink href={trialHref} size="lg" className="w-full">
              {t("bookTrial")}
            </ButtonLink>
            {direction?.has_test && (
              <ButtonLink href={`/test/${direction.slug}`} variant="secondary" className="w-full">
                {t("takeTest")}
              </ButtonLink>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
