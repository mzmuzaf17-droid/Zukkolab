import { normalizeUzPhone } from "@/lib/phone";

// Forma va API uchun umumiy qoidalar. Brauzer faqat shu faylni oladi — Zod (~90 KB) klient bundle'ga tushmaydi (NFR-01).
export const NAME_PATTERN = /^[^<>{}\d]+$/u;
export const NAME_MIN = 2;
export const NAME_MAX = 80;

export function isValidName(value: string): boolean {
  const v = value.trim();
  return v.length >= NAME_MIN && v.length <= NAME_MAX && NAME_PATTERN.test(v);
}

export function isValidPhone(value: string): boolean {
  return normalizeUzPhone(value.trim()) !== null;
}
