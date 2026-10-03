import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LevelTest } from "@/components/test/level-test";
import { getDirections } from "@/lib/data/content";
import { pick } from "@/lib/i18n/pick";
import type { Locale } from "@/lib/i18n/routing";
import { levelScale } from "@/lib/levels";
import { alternates } from "@/lib/seo";

export async function generateStaticParams() {
  return (await getDirections()).filter((d) => d.has_test).map((d) => ({ direction: d.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/test/[direction]">): Promise<Metadata> {
  const { locale, direction: slug } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const direction = (await getDirections()).find((d) => d.slug === slug);
  return {
    title: direction ? `${t("testTitle")}: ${pick(direction, "name", locale as Locale)}` : t("testTitle"),
    alternates: alternates(locale, `/test/${slug}`),
  };
}

export default async function TestPage({ params }: PageProps<"/[locale]/test/[direction]">) {
  const { locale: raw, direction: slug } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);
  const direction = (await getDirections()).find((d) => d.slug === slug && d.has_test);
  if (!direction) notFound();

  const [t, tl] = await Promise.all([getTranslations("test"), getTranslations("levels")]);
  const scale = levelScale(slug);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 md:py-12">
      <p className="text-muted text-sm font-semibold">{t("title")}</p>
      <h1 className="font-display mb-8 text-[28px] leading-tight font-bold md:text-[36px]">
        {pick(direction, "name", locale)}
      </h1>
      <LevelTest
        directionSlug={slug}
        levelNames={scale ? (tl.raw(scale) as string[]) : null}
        languageTest={slug === "english" || slug === "russian"}
      />
    </div>
  );
}
