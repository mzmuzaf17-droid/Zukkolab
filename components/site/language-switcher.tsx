"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { locales } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";

// FR-SITE-01: til almashganda foydalanuvchi o'sha sahifada qoladi.
export function LanguageSwitcher({ className }: { className?: string }) {
  const pathname = usePathname();
  const current = useLocale();
  const t = useTranslations("locales");

  return (
    <nav
      aria-label={t(current as (typeof locales)[number])}
      className={cn("flex items-center gap-1", className)}
    >
      {locales.map((locale) => (
        <Link
          key={locale}
          href={pathname}
          locale={locale}
          hrefLang={locale}
          aria-current={locale === current ? "true" : undefined}
          title={t(locale)}
          className={cn(
            "inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-semibold uppercase",
            locale === current ? "bg-ink text-white" : "text-muted hover:text-ink",
          )}
        >
          {locale}
        </Link>
      ))}
    </nav>
  );
}
