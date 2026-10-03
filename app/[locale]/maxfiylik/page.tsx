import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata({ params }: PageProps<"/[locale]/maxfiylik">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("privacyTitle") };
}

export default async function PrivacyPage({ params }: PageProps<"/[locale]/maxfiylik">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("privacy");

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-10 md:py-14">
      <h1 className="font-display text-[32px] leading-tight font-bold md:text-[44px]">{t("title")}</h1>
      <p className="text-muted mt-2 text-sm">{t("updated")}</p>
      <div className="text-ink/85 mt-8 space-y-4 text-lg leading-relaxed">
        {(["p1", "p2", "p3", "p4"] as const).map((k) => (
          <p key={k}>{t(k)}</p>
        ))}
      </div>
    </article>
  );
}
