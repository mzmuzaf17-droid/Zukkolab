// Davr filtri (FR-ADM-02): bugun / 7 kun / 30 kun — Toshkent vaqti bo'yicha.
export const PERIODS = [
  { key: "today", label: "Bugun", days: 0 },
  { key: "7", label: "7 kun", days: 7 },
  { key: "30", label: "30 kun", days: 30 },
] as const;
export type PeriodKey = (typeof PERIODS)[number]["key"];

export function periodFrom(key: string | undefined, now = new Date()): { key: PeriodKey; from: string } {
  const period = PERIODS.find((p) => p.key === key) ?? PERIODS[2];
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tashkent" }).format(now);
  const start = new Date(`${today}T00:00:00+05:00`);
  start.setUTCDate(start.getUTCDate() - period.days);
  return { key: period.key, from: start.toISOString() };
}

export function percent(part: number, whole: number): string {
  return whole > 0 ? `${Math.round((part / whole) * 100)}%` : "—";
}
