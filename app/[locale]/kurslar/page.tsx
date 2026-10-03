import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CourseCard } from "@/components/site/course-card";
import { buttonClass } from "@/components/ui/button";
import { getBranches, getCourses, getDirections, getOpenGroups, nextGroupFor } from "@/lib/data/content";
import { Link } from "@/lib/i18n/navigation";
import { pick } from "@/lib/i18n/pick";
import type { Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";

const AGES = ["kids", "teens", "adults"] as const;
type Filters = { direction?: string; age?: string; branch?: string };

export async function generateMetadata({ params }: PageProps<"/[locale]/kurslar">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("catalogTitle") };
}

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value || undefined;
}

// FR-SITE-07: filtrlar URL'da — havolani ulashsa bo'ladi.
function filterHref(current: Filters, key: keyof Filters, value: string | undefined) {
  const query: Record<string, string> = {};
  for (const [k, v] of Object.entries({ ...current, [key]: value })) if (v) query[k] = v;
  return { pathname: "/kurslar" as const, query };
}

export default async function CatalogPage({ params, searchParams }: PageProps<"/[locale]/kurslar">) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);
  const sp = await searchParams;
  const filters: Filters = { direction: one(sp.direction), age: one(sp.age), branch: one(sp.branch) };

  const [t, directions, courses, groups, branches] = await Promise.all([
    getTranslations("catalog"),
    getDirections(),
    getCourses(),
    getOpenGroups(),
    getBranches(),
  ]);
  const tc = await getTranslations("course");
  const directionById = new Map(directions.map((d) => [d.id, d]));
  const directionId = directions.find((d) => d.slug === filters.direction)?.id;
  const branchId = branches.find((b) => b.slug === filters.branch)?.id;

  const list = courses.filter(
    (c) =>
      (!filters.direction || c.direction_id === directionId) &&
      (!filters.age || c.age_group === filters.age) &&
      (!filters.branch || groups.some((g) => g.course_id === c.id && g.branch_id === branchId)),
  );
  const hasFilters = Boolean(filters.direction || filters.age || filters.branch);

  const chip = (active: boolean) =>
    cn(
      "inline-flex min-h-10 items-center rounded-xl border px-3.5 text-sm font-semibold whitespace-nowrap",
      active ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink/40",
    );

  const groupsUi: { key: keyof Filters; label: string; options: { value: string; label: string }[] }[] = [
    {
      key: "direction",
      label: t("direction"),
      options: directions.map((d) => ({ value: d.slug, label: pick(d, "name", locale) })),
    },
    { key: "age", label: t("age"), options: AGES.map((a) => ({ value: a, label: tc(`age.${a}`) })) },
    {
      key: "branch",
      label: t("branch"),
      options: branches.map((b) => ({ value: b.slug, label: pick(b, "name", locale) })),
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:py-14">
      <h1 className="font-display text-[36px] leading-tight font-bold md:text-[48px]">{t("title")}</h1>
      <p className="text-muted mt-2 text-lg">{t("subtitle")}</p>

      <div className="mt-8 space-y-4">
        {groupsUi.map((g) => (
          <div key={g.key} className="space-y-2">
            <p className="text-muted text-sm font-semibold">{g.label}</p>
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
              <Link
                href={filterHref(filters, g.key, undefined)}
                className={chip(!filters[g.key])}
                scroll={false}
              >
                {t("all")}
              </Link>
              {g.options.map((o) => (
                <Link
                  key={o.value}
                  href={filterHref(filters, g.key, o.value)}
                  className={chip(filters[g.key] === o.value)}
                  aria-current={filters[g.key] === o.value ? "true" : undefined}
                  scroll={false}
                >
                  {o.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between gap-4">
        <p className="text-muted text-sm font-semibold" aria-live="polite">
          {t("count", { count: list.length })}
        </p>
        {hasFilters && (
          <Link
            href="/kurslar"
            className="text-brand text-sm font-semibold underline-offset-2 hover:underline"
          >
            {t("reset")}
          </Link>
        )}
      </div>

      {list.length > 0 ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => (
            <CourseCard
              key={c.id}
              course={c}
              direction={directionById.get(c.direction_id)}
              nextGroup={nextGroupFor(c.id, groups)}
            />
          ))}
        </div>
      ) : (
        // FR-SITE-12: bo'sh holat — tushuntirish va filtrni tozalash.
        <div className="border-line mt-4 rounded-[20px] border border-dashed bg-white px-5 py-12 text-center">
          <p className="font-display text-xl font-semibold">{t("empty")}</p>
          <p className="text-muted mt-2">{t("emptyHint")}</p>
          <Link href="/kurslar" className={buttonClass("secondary", "md", "mt-6")}>
            {t("reset")}
          </Link>
        </div>
      )}
    </div>
  );
}
