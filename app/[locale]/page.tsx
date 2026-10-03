import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  ClipboardCheck,
  MessageSquareHeart,
  ShieldCheck,
  Users,
  Video,
} from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LeadForm } from "@/components/forms/lead-form";
import { BranchCard } from "@/components/site/branch-card";
import { CourseCard } from "@/components/site/course-card";
import { DirectionIcon } from "@/components/site/direction-icon";
import { FaqList } from "@/components/site/faq-list";
import { HeroPreview } from "@/components/site/hero-preview";
import { Section } from "@/components/site/section";
import { TeacherCard } from "@/components/site/teacher-card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import {
  getBranches,
  getCourses,
  getDirections,
  getFaq,
  getOpenGroups,
  getTeachers,
  getTestimonials,
  nextGroupFor,
} from "@/lib/data/content";
import { formatAmount } from "@/lib/format";
import { Link } from "@/lib/i18n/navigation";
import { pick } from "@/lib/i18n/pick";
import type { Locale } from "@/lib/i18n/routing";
import { alternates } from "@/lib/seo";
import { textOn } from "@/lib/utils";

export const revalidate = 60;

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  return { alternates: alternates(locale) };
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);

  const [t, tc, directions, courses, groups, teachers, testimonials, branches, faq] = await Promise.all([
    getTranslations("home"),
    getTranslations("cta"),
    getDirections(),
    getCourses(),
    getOpenGroups(),
    getTeachers(),
    getTestimonials(),
    getBranches(),
    getFaq(),
  ]);
  const tt = await getTranslations("testimonials");
  const tl = await getTranslations("leadForm");
  const directionById = new Map(directions.map((d) => [d.id, d]));
  const featured = courses.filter((c) => c.is_featured).slice(0, 6);
  const minPrice = Math.min(...courses.map((c) => c.price_monthly));
  const previewCourse = courses.find((c) => c.slug === "ielts-intensive") ?? featured[0];

  const why = [
    { icon: Users, title: t("why.groupsTitle"), text: t("why.groupsText") },
    { icon: ShieldCheck, title: t("why.resultTitle"), text: t("why.resultText") },
    { icon: Video, title: t("why.recordTitle"), text: t("why.recordText") },
    { icon: MessageSquareHeart, title: t("why.parentsTitle"), text: t("why.parentsText") },
  ];
  const prices = [
    { title: t("prices.monthlyTitle"), text: t("prices.monthlyText") },
    { title: t("prices.upfrontTitle"), text: t("prices.upfrontText") },
    { title: t("prices.siblingsTitle"), text: t("prices.siblingsText") },
    { title: t("prices.guaranteeTitle"), text: t("prices.guaranteeText") },
  ];

  return (
    <>
      {/* Hero: bitta aniq va'da, 2 tugma, 3 raqam */}
      <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pt-10 pb-12 md:pt-16 md:pb-20 lg:grid-cols-[1fr_380px]">
        <div>
          <Badge tone="cta" className="mb-5 text-sm">
            {t("heroBadge")}
          </Badge>
          <h1 className="font-display max-w-3xl text-[36px] leading-[1.1] font-bold md:text-[56px]">
            {t("heroTitle")}
          </h1>
          <p className="text-muted mt-5 max-w-2xl text-lg md:text-xl">{t("heroSubtitle")}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/test" size="lg">
              <ClipboardCheck className="size-5" aria-hidden />
              {t("heroPrimary")}
            </ButtonLink>
            <ButtonLink href="/sinov-darsi" variant="secondary" size="lg">
              <CalendarCheck className="size-5" aria-hidden />
              {t("heroSecondary")}
            </ButtonLink>
          </div>
          <dl className="mt-10 grid max-w-xl grid-cols-3 gap-4">
            {(
              [
                ["students", "studentsLabel"],
                ["years", "yearsLabel"],
                ["rating", "ratingLabel"],
              ] as const
            ).map(([value, label]) => (
              <div key={value} className="flex flex-col-reverse justify-end">
                <dt className="text-muted text-sm">{t(`stats.${label}`)}</dt>
                <dd className="font-display text-2xl font-bold md:text-[28px]">{t(`stats.${value}`)}</dd>
              </div>
            ))}
          </dl>
        </div>
        {previewCourse && (
          <HeroPreview
            course={previewCourse}
            nextGroup={nextGroupFor(previewCourse.id, groups)}
            locale={locale}
          />
        )}
      </section>

      {/* Yo'nalishlar */}
      <Section title={t("directionsTitle")} subtitle={t("directionsSubtitle")} className="pt-0 md:pt-0">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {directions.map((d) => {
            const count = courses.filter((c) => c.direction_id === d.id).length;
            return (
              <Link
                key={d.id}
                href={{ pathname: "/kurslar", query: { direction: d.slug } }}
                className="border-line flex flex-col gap-3 rounded-[20px] border bg-white p-4 transition-transform duration-200 hover:-translate-y-0.5"
              >
                <span
                  className="inline-flex size-11 items-center justify-center rounded-xl"
                  style={{ backgroundColor: d.color, color: textOn(d.color) }}
                >
                  <DirectionIcon name={d.icon} className="size-5" />
                </span>
                <span className="font-semibold">{pick(d, "name", locale)}</span>
                <span className="text-muted text-sm">{t("coursesCount", { count })}</span>
              </Link>
            );
          })}
        </div>
      </Section>

      {/* Daraja testi */}
      <section className="mx-auto w-full max-w-6xl px-4">
        <div className="bg-ink rounded-[24px] px-5 py-8 text-white md:px-10 md:py-12">
          <h2 className="font-display text-[28px] leading-tight font-bold md:text-[40px]">
            {t("testTitle")}
          </h2>
          <p className="mt-3 max-w-2xl text-white/70 md:text-lg">{t("testSubtitle")}</p>
          <p className="mt-6 text-sm font-semibold text-white/60">{t("testChoose")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {directions
              .filter((d) => d.has_test)
              .map((d) => (
                <Link
                  key={d.id}
                  href={`/test/${d.slug}`}
                  className="hover:bg-cta hover:text-ink inline-flex min-h-11 items-center gap-2 rounded-xl bg-white/10 px-4 font-semibold transition-colors"
                >
                  <DirectionIcon name={d.icon} className="size-4" />
                  {pick(d, "name", locale)}
                </Link>
              ))}
          </div>
        </div>
      </section>

      {/* Ommabop kurslar */}
      <Section
        title={t("featuredTitle")}
        subtitle={t("featuredSubtitle")}
        action={
          <ButtonLink href="/kurslar" variant="ghost">
            {tc("allCourses")}
            <ArrowRight className="size-4" aria-hidden />
          </ButtonLink>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((c) => (
            <CourseCard
              key={c.id}
              course={c}
              direction={directionById.get(c.direction_id)}
              nextGroup={nextGroupFor(c.id, groups)}
            />
          ))}
        </div>
      </Section>

      {/* Nega Zukkolab */}
      <Section title={t("whyTitle")} className="pt-0 md:pt-0">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {why.map(({ icon: Icon, title, text }) => (
            <div key={title} className="bg-brand/5 rounded-[20px] p-5">
              <Icon className="text-brand size-7" aria-hidden />
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="text-ink/75 mt-1 text-sm">{text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* O'qituvchilar — telefonda gorizontal karusel */}
      <Section title={t("teachersTitle")} subtitle={t("teachersSubtitle")} className="pt-0 md:pt-0">
        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0">
          {teachers.map((teacher) => (
            <div key={teacher.id} className="w-[80%] shrink-0 snap-start sm:w-[45%] md:w-auto">
              <TeacherCard teacher={teacher} direction={directionById.get(teacher.direction_id)} />
            </div>
          ))}
        </div>
      </Section>

      {/* Natijalar */}
      <Section title={t("resultsTitle")} className="pt-0 md:pt-0">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((item) => (
            <figure
              key={item.id}
              className="border-line flex flex-col gap-4 rounded-[20px] border bg-white p-5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="brand">{pick(item, "achievement", locale)}</Badge>
                {item.is_demo && <Badge tone="muted">{tt("demo")}</Badge>}
              </div>
              <blockquote className="text-ink/85">“{pick(item, "text", locale)}”</blockquote>
              <figcaption className="mt-auto flex items-center gap-2 text-sm font-semibold">
                <BadgeCheck className="text-brand size-4" aria-hidden />
                {item.name}
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>

      {/* Narx va to'lov */}
      <Section
        id="narxlar"
        title={t("pricesTitle")}
        subtitle={t("pricesFrom", { price: formatAmount(minPrice, locale) })}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {prices.map((p) => (
            <div key={p.title} className="border-line rounded-[20px] border bg-white p-5">
              <h3 className="font-semibold">{p.title}</h3>
              <p className="text-muted mt-1 text-sm">{p.text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Filiallar */}
      <Section title={t("branchesTitle")} subtitle={t("branchesSubtitle")} className="pt-0 md:pt-0">
        <div className="grid gap-4 md:grid-cols-3">
          {branches.map((b) => (
            <BranchCard key={b.id} branch={b} />
          ))}
        </div>
      </Section>

      {/* FAQ */}
      <Section id="savollar" title={t("faqTitle")} className="pt-0 md:pt-0">
        <FaqList items={faq} />
      </Section>

      {/* Yakuniy blok */}
      <section id="ariza" className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 pb-8 md:pb-16">
        <div className="bg-brand grid gap-8 rounded-[24px] px-5 py-10 text-white md:px-10 md:py-14 lg:grid-cols-[1fr_420px] lg:items-center">
          <div>
            <h2 className="font-display text-[28px] leading-tight font-bold md:text-[40px]">
              {t("finalTitle")}
            </h2>
            <p className="mt-3 max-w-xl text-white md:text-lg">{t("finalSubtitle")}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/sinov-darsi" size="lg">
                {tc("trial")}
              </ButtonLink>
              <ButtonLink
                href="/test"
                size="lg"
                className="border-2 border-white/40 bg-transparent text-white"
              >
                {t("finalTest")}
              </ButtonLink>
            </div>
          </div>
          <div className="space-y-3">
            <p className="font-semibold">{tl("subtitle")}</p>
            <LeadForm directions={directions.map((d) => ({ slug: d.slug, name: pick(d, "name", locale) }))} />
          </div>
        </div>
      </section>
    </>
  );
}
