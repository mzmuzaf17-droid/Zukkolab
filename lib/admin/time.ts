import { formatDateTime } from "@/lib/format";

// "12 daqiqa oldin" (FR-ADM-05); bir kundan eskisi — sana bilan.
export function timeAgo(iso: string, now = Date.now()): string {
  const min = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000));
  if (min < 1) return "hozirgina";
  if (min < 60) return `${min} daqiqa oldin`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} soat oldin`;
  return formatDateTime(iso, "uz");
}

// Server komponentlar har so'rovda qayta render bo'ladi — "hozir" so'rov vaqti.
export function requestTime(): number {
  return Date.now();
}
