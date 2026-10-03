import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DirectionIcon } from "@/components/site/direction-icon";
import { getDirections } from "@/lib/data/content";
import { Link } from "@/lib/i18n/navigation";
import { pick } from "@/lib/i18n/pick";
import type { Locale } from "@/lib/i18n/routing";
import { isInterestTest } from "@/lib/test-engine";
import { alternates } from "@/lib/seo";
import { textOn } from "@/lib/utils";

export const revalidate = 60;

export async function generateMetadata({ params }: PageProps<"/[locale]/test">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("testTitle"), alternates: alternates(locale, "/test") };
}

export default async function TestChooserPage({ params }: PageProps<"/[locale]/test">) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);
  const [t, directions] = await Promise.all([getTranslations("test"), getDirections()]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 md:py-14">
      <h1 className="font-display text-[32px] leading-tight font-bold md:text-[44px]">{t("chooseTitle")}</h1>
      <p className="text-muted mt-3 text-lg">{t("chooseSubtitle")}</p>
      <div className="mt-8 grid gap-3">
        {directions
          .filter((d) => d.has_test)
          .map((d) => (
            <Link
              key={d.id}
              href={`/test/${d.slug}`}
              className="group border-line hover:border-ink/30 flex min-h-16 items-center gap-4 rounded-[20px] border bg-white p-4"
            >
              <span
                className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: d.color, color: textOn(d.color) }}
              >
                <DirectionIcon name={d.icon} className="size-6" />
              </span>
              <span className="flex-1">
                <span className="block font-semibold">{pick(d, "name", locale)}</span>
                {isInterestTest(d.slug) && (
                  <span className="text-muted text-sm">{t("interestSubtitle")}</span>
                )}
              </span>
              <ArrowRight
                className="text-brand size-5 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          ))}
      </div>
    </div>
  );
}
