import { brand } from "@/brand.config";

// Telegram deep link; start parametri: src_*, bk_*, test_* (7-bo'lim).
export function telegramLink(start?: string): string {
  const base = `https://t.me/${brand.telegramBot}`;
  return start ? `${base}?start=${encodeURIComponent(start)}` : base;
}

// FR-SITE-10: "Yo'l ko'rsatish" — Yandex va Google xaritalariga marshrut.
export function yandexRouteLink(lat: number, lng: number): string {
  return `https://yandex.uz/maps/?rtext=~${lat},${lng}&rtt=auto`;
}

export function googleRouteLink(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
