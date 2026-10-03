import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { brand } from "@/brand.config";

// 1-kun: poydevor tekshiruvi uchun hero. Toʻliq bosh sahifa 2-kunda.
export default function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("home");

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-6 px-4 py-16">
      <p className="font-display text-2xl font-bold">
        {brand.wordmark.first}
        <span className="bg-cta ml-0.5 rounded-md px-1.5">{brand.wordmark.second}</span>
      </p>
      <h1 className="font-display text-4xl leading-tight font-bold md:text-[56px]">{t("heroTitle")}</h1>
      <p className="text-muted max-w-xl text-lg">{t("heroSubtitle")}</p>
      <div className="flex flex-wrap gap-3">
        <a
          href={`/${locale}/test`}
          className="bg-cta text-ink inline-flex min-h-11 items-center rounded-[14px] px-5 font-semibold"
        >
          {t("heroPrimary")}
        </a>
        <a
          href={`/${locale}/sinov-darsi`}
          className="border-brand text-brand inline-flex min-h-11 items-center rounded-[14px] border-2 px-5 font-semibold"
        >
          {t("heroSecondary")}
        </a>
      </div>
    </main>
  );
}
