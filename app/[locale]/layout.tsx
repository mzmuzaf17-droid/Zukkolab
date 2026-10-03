import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AiChat } from "@/components/ai/ai-chat";
import { BottomCtaBar } from "@/components/site/bottom-cta-bar";
import { DemoBanner } from "@/components/site/demo-banner";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { TelegramMiniApp } from "@/components/site/telegram-mini-app";
import { isDemoMode } from "@/lib/env";
import { manrope, unbounded } from "@/lib/fonts";
import { routing } from "@/lib/i18n/routing";
import "../globals.css";

export const viewport: Viewport = {
  themeColor: "#14121F",
  width: "device-width",
  initialScale: 1,
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    title: { default: t("title"), template: `%s · Zukkolab` },
    description: t("description"),
    // Demo rejimida toʻqima maʼlumotlar qidiruvga tushmasin (NFR-05).
    robots: isDemoMode() ? { index: false, follow: false } : undefined,
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale} className={`${manrope.variable} ${unbounded.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider>
          {isDemoMode() && <DemoBanner />}
          <Header />
          <main className="flex flex-1 flex-col">{children}</main>
          <Footer />
          <BottomCtaBar />
          <AiChat />
          <TelegramMiniApp />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
