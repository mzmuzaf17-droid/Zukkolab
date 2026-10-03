import type { Locale } from "@/lib/i18n/routing";

// 1200000 → "1 200 000" (bo'shliq — bo'linmas, raqam qatorda uzilmaydi). FR-SITE-09.
export function formatAmount(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "ru-RU").format(amount);
}

const UZ_MONTHS = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avgust",
  "sentabr",
  "oktabr",
  "noyabr",
  "dekabr",
];

// "2026-10-14" → "14-oktabr" | "14 октября" | "October 14" (NFR-08).
export function formatDay(isoDate: string, locale: Locale): string {
  const [y, m, d] = isoDate.slice(0, 10).split("-").map(Number);
  if (locale === "uz") return `${d}-${UZ_MONTHS[m - 1]}`;
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(date);
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

const TZ = "Asia/Tashkent";
const UZ_WEEKDAYS = ["Ya", "Du", "Se", "Ch", "Pa", "Ju", "Sh"];

// ISO vaqt → Toshkent bo'yicha sana "YYYY-MM-DD".
export function tashkentDate(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(iso));
}

// ISO vaqt → "18:00" (Toshkent).
export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(
    new Date(iso),
  );
}

export function weekdayShort(isoDate: string, locale: Locale): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  if (locale === "uz") return UZ_WEEKDAYS[d.getUTCDay()];
  return new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "en-US", {
    weekday: "short",
    timeZone: "UTC",
  }).format(d);
}

// "14-oktabr, 18:00" (NFR-08).
export function formatDateTime(iso: string, locale: Locale): string {
  return `${formatDay(tashkentDate(iso), locale)}, ${formatTime(iso)}`;
}
