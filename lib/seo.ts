import type { Metadata } from "next";
import { locales, routing, type Locale } from "@/lib/i18n/routing";

// NFR-05: har sahifada canonical va hreflang (uz/ru/en + x-default). path — tilsiz yo'l: "", "/kurslar".
export function alternates(locale: Locale | string, path = ""): Metadata["alternates"] {
  return {
    canonical: `/${locale}${path}`,
    languages: {
      ...Object.fromEntries(locales.map((l) => [l, `/${l}${path}`])),
      "x-default": `/${routing.defaultLocale}${path}`,
    },
  };
}
