import type { Locale } from "./routing";

// Ko'p tilli ustundan joriy tildagisini oladi: pick(course, "title", "ru") → course.title_ru.
export function pick<K extends string, R extends Record<`${K}_${Locale}`, unknown>>(
  row: R,
  key: K,
  locale: Locale,
): R[`${K}_${Locale}`] {
  return row[`${key}_${locale}`];
}
