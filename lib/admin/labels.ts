// Panel matnlari (panel tili — o'zbekcha; markaz xodimlari uchun).
import type { Enums } from "@/lib/supabase/types";

export const STATUS_LABEL: Record<Enums<"lead_status">, string> = {
  new: "Yangi",
  contacted: "Bogʻlanildi",
  trial_booked: "Sinovga yozildi",
  trial_attended: "Sinovga keldi",
  paid: "Toʻladi",
  lost: "Yoʻqotildi",
};

export const STATUS_TONE: Record<Enums<"lead_status">, string> = {
  new: "bg-coral/15 text-ink",
  contacted: "bg-ink/5 text-ink",
  trial_booked: "bg-brand/10 text-brand",
  trial_attended: "bg-brand/20 text-brand",
  paid: "bg-cta text-ink",
  lost: "bg-ink/5 text-muted",
};

export const LOST_REASON_LABEL: Record<Enums<"lost_reason">, string> = {
  expensive: "Qimmat",
  far: "Uzoq",
  schedule: "Vaqt mos emas",
  no_answer: "Javob bermadi",
  other: "Boshqa",
};

export const BOOKING_STATUS_LABEL: Record<Enums<"booking_status">, string> = {
  booked: "Yozilgan",
  attended: "Keldi",
  no_show: "Kelmadi",
  cancelled: "Bekor qilindi",
};

export const SOURCE_LABEL: Record<string, string> = {
  instagram: "Instagram",
  telegram: "Telegram",
  google: "Google",
  facebook: "Facebook",
  yandex: "Yandex",
  referral: "Tavsiya (ulashilgan test)",
  demo: "Demo (QR)",
  direct: "Toʻgʻridan-toʻgʻri",
  other: "Boshqa",
};

export const EVENT_LABEL: Record<string, string> = {
  created: "Lid yaratildi",
  status_changed: "Holat oʻzgardi",
  assigned: "Biriktirildi",
  taken: "Menejer oldi",
  called: "Qoʻngʻiroq qilindi",
  note: "Izoh",
  trial_booked: "Sinov darsiga yozildi",
  confirmed: "Mijoz “Kelaman” dedi",
  cancelled_by_client: "Mijoz bronni bekor qildi",
  duplicate_submit: "Takroriy ariza",
  feedback: "Sinov darsiga baho",
  wants_enroll: "Guruhga yozilmoqchi",
};

// Ruxsat etilgan o'tishlar (8-bo'lim diagrammasi) — bazadagi lead_status_allowed() bilan bir xil.
export const NEXT_STATUSES: Record<Enums<"lead_status">, Enums<"lead_status">[]> = {
  new: ["contacted", "trial_booked", "lost"],
  contacted: ["trial_booked", "lost"],
  trial_booked: ["trial_attended", "contacted", "lost"],
  trial_attended: ["paid", "lost"],
  paid: [],
  lost: [],
};

export function sourceLabel(source: string): string {
  return SOURCE_LABEL[source] ?? source;
}
