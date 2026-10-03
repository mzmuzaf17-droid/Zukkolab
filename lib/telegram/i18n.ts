import { createTranslator } from "next-intl";
import en from "@/messages/en.json";
import ru from "@/messages/ru.json";
import uz from "@/messages/uz.json";
import { isLocale, type Locale } from "@/lib/i18n/routing";

// Bot va bildirishnomalar matnlari sayt bilan bitta i18n fayllaridan (7-bo'lim).
const all = { uz, ru, en } as const;

export function botT(locale: Locale) {
  return createTranslator({ locale, messages: all[locale], namespace: "bot" });
}

export function groupT(locale: Locale = "uz") {
  return createTranslator({ locale, messages: all[locale], namespace: "group" });
}

export function anyT(locale: Locale) {
  return createTranslator({ locale, messages: all[locale] });
}

// Telegram language_code → sayt tili.
export function localeFromTelegram(code: string | undefined): Locale {
  const short = (code ?? "").slice(0, 2);
  return isLocale(short) ? short : "uz";
}
