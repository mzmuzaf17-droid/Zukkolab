import { Clock, MapPin, Navigation, Phone } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import type { Branch } from "@/lib/data/content";
import { telHref } from "@/lib/format";
import { pick } from "@/lib/i18n/pick";
import type { Locale } from "@/lib/i18n/routing";
import { googleRouteLink, yandexRouteLink } from "@/lib/links";
import { formatUzPhone } from "@/lib/phone";

export async function BranchCard({ branch }: { branch: Branch }) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("branches");
  const linkClass =
    "border-line inline-flex min-h-11 items-center gap-1.5 rounded-xl border px-3 text-sm font-semibold hover:bg-ink/5";

  return (
    <article className="border-line flex h-full flex-col gap-4 rounded-[20px] border bg-white p-5">
      <h3 className="font-display text-xl font-semibold">{pick(branch, "name", locale)}</h3>
      <ul className="text-ink/80 space-y-2 text-sm">
        <li className="flex gap-2">
          <MapPin className="text-brand mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            {pick(branch, "address", locale)}
            {pick(branch, "landmark", locale) && (
              <span className="text-muted block">{pick(branch, "landmark", locale)}</span>
            )}
          </span>
        </li>
        <li className="flex gap-2">
          <Clock className="text-brand mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{pick(branch, "working_hours", locale)}</span>
        </li>
        <li className="flex gap-2">
          <Phone className="text-brand mt-0.5 size-4 shrink-0" aria-hidden />
          <a href={telHref(branch.phone)} className="hover:text-ink underline-offset-2 hover:underline">
            {formatUzPhone(branch.phone)}
          </a>
        </li>
      </ul>
      <div className="mt-auto flex flex-wrap gap-2" aria-label={t("route")}>
        <a
          href={yandexRouteLink(branch.lat, branch.lng)}
          className={linkClass}
          target="_blank"
          rel="noopener"
        >
          <Navigation className="size-4" aria-hidden />
          {t("yandex")}
        </a>
        <a
          href={googleRouteLink(branch.lat, branch.lng)}
          className={linkClass}
          target="_blank"
          rel="noopener"
        >
          <Navigation className="size-4" aria-hidden />
          {t("google")}
        </a>
      </div>
    </article>
  );
}
