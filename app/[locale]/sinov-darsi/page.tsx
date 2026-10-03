import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { getBranches, getCourses, getDirections } from "@/lib/data/content";
import { pick } from "@/lib/i18n/pick";
import type { Locale } from "@/lib/i18n/routing";
import { alternates } from "@/lib/seo";

export async function generateMetadata({ params }: PageProps<"/[locale]/sinov-darsi">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("bookingTitle"), alternates: alternates(locale, "/sinov-darsi") };
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;
const UUID = /^[0-9a-f-]{36}$/i;

export default async function BookingPage({ params, searchParams }: PageProps<"/[locale]/sinov-darsi">) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);
  const sp = await searchParams;
  const [t, directions, branches, courses] = await Promise.all([
    getTranslations("booking"),
    getDirections(),
    getBranches(),
    getCourses(),
  ]);

  const course = courses.find((c) => c.slug === one(sp.course));
  const directionSlug =
    directions.find((d) => d.slug === one(sp.direction))?.slug ??
    directions.find((d) => d.id === course?.direction_id)?.slug;
  const attempt = one(sp.attempt);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 md:py-12">
      <h1 className="font-display text-[32px] leading-tight font-bold md:text-[44px]">{t("title")}</h1>
      <p className="text-muted mt-2 mb-8 text-lg">{t("subtitle")}</p>
      <BookingWizard
        directions={directions.map((d) => ({ slug: d.slug, name: pick(d, "name", locale) }))}
        branches={branches.map((b) => ({ slug: b.slug, name: pick(b, "name", locale) }))}
        initial={{
          direction: directionSlug,
          branch: branches.find((b) => b.slug === one(sp.branch))?.slug,
          course: course?.slug,
          attempt: attempt && UUID.test(attempt) ? attempt : undefined,
          demo: one(sp.demo) === "1",
        }}
      />
    </div>
  );
}
