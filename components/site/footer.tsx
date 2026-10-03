import { getTranslations } from "next-intl/server";
import { brand } from "@/brand.config";
import { formatUzPhone } from "@/lib/phone";
import { telHref } from "@/lib/format";
import { Link } from "@/lib/i18n/navigation";
import { Logo } from "./logo";

export async function Footer() {
  const t = await getTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ink mt-auto pb-[calc(var(--bottom-bar-height)+env(safe-area-inset-bottom))] text-white/80 md:pb-0">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div className="space-y-3">
          <div className="text-white [&_a]:text-white">
            <Logo />
          </div>
          <p className="text-sm">{t("demoNote")}</p>
        </div>
        <div className="space-y-2">
          <h2 className="font-semibold text-white">{t("contacts")}</h2>
          <a href={telHref(brand.phone)} className="block min-h-11 py-2 hover:text-white">
            {formatUzPhone(brand.phone)}
          </a>
          <a href={`mailto:${brand.email}`} className="block hover:text-white">
            {brand.email}
          </a>
        </div>
        <div className="space-y-2">
          <h2 className="font-semibold text-white">{t("follow")}</h2>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <a href={brand.social.instagram} className="py-2 hover:text-white" rel="noopener" target="_blank">
              Instagram
            </a>
            <a href={brand.social.telegram} className="py-2 hover:text-white" rel="noopener" target="_blank">
              Telegram
            </a>
            <a href={brand.social.youtube} className="py-2 hover:text-white" rel="noopener" target="_blank">
              YouTube
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs">
          <span>
            © {year} {brand.name}. {t("rights")}
          </span>
          <Link href="/maxfiylik" className="py-2 hover:text-white">
            {t("privacy")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
