import { ChevronDown } from "lucide-react";
import { getLocale } from "next-intl/server";
import type { Faq } from "@/lib/data/content";
import { pick } from "@/lib/i18n/pick";
import type { Locale } from "@/lib/i18n/routing";

// Accordion — <details> bilan: JavaScript'siz ishlaydi, klaviatura bilan boshqariladi.
export async function FaqList({ items }: { items: Faq[] }) {
  const locale = (await getLocale()) as Locale;
  return (
    <div className="divide-line border-line divide-y rounded-[20px] border bg-white">
      {items.map((item) => (
        <details key={item.id} className="group px-5">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold [&::-webkit-details-marker]:hidden">
            {pick(item, "question", locale)}
            <ChevronDown
              className="text-muted size-5 shrink-0 transition-transform group-open:rotate-180"
              aria-hidden
            />
          </summary>
          <p className="text-ink/80 pb-5">{pick(item, "answer", locale)}</p>
        </details>
      ))}
    </div>
  );
}
