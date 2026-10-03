import { getLocale, getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import type { Direction, Teacher } from "@/lib/data/content";
import { pick } from "@/lib/i18n/pick";
import type { Locale } from "@/lib/i18n/routing";
import { textOn } from "@/lib/utils";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
}

export async function TeacherCard({
  teacher,
  direction,
}: {
  teacher: Teacher;
  direction: Direction | undefined;
}) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("teacher");

  return (
    <article className="border-line flex h-full flex-col gap-4 rounded-[20px] border bg-white p-5">
      <div className="flex items-center gap-3">
        {/* Rasm o'rniga initsiallar: demo rasmlari keyinroq qo'shiladi. */}
        <div
          className="font-display flex size-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold"
          style={{
            backgroundColor: direction?.color ?? "var(--color-brand)",
            color: textOn(direction?.color),
          }}
          aria-hidden
        >
          {initials(teacher.full_name)}
        </div>
        <div>
          <h3 className="font-semibold">{teacher.full_name}</h3>
          <p className="text-muted text-sm">
            {direction ? pick(direction, "name", locale) : ""} ·{" "}
            {t("experience", { years: teacher.experience_years })}
          </p>
        </div>
      </div>
      <p className="text-ink/80 text-sm">{pick(teacher, "bio", locale)}</p>
      <div className="mt-auto flex flex-wrap gap-1.5">
        {teacher.certificates.map((c) => (
          <Badge key={c} tone="muted">
            {c}
          </Badge>
        ))}
      </div>
    </article>
  );
}
