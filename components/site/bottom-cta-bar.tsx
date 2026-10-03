import { CalendarCheck, ClipboardCheck, Send } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";
import { telegramLink } from "@/lib/links";

// Telefonda har sahifada doim ko'rinadigan pastki panel (5-bo'lim): Test · Sinov darsi · Telegram.
export async function BottomCtaBar() {
  const t = await getTranslations("bottomBar");
  const item = "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-semibold";

  return (
    <nav
      aria-label={t("trial")}
      className="border-line bg-bg/95 fixed inset-x-0 bottom-0 z-40 flex border-t pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <Link href="/test" className={item}>
        <ClipboardCheck className="size-5" aria-hidden />
        {t("test")}
      </Link>
      <Link href="/sinov-darsi" className={`${item} bg-cta m-1.5 rounded-xl`}>
        <CalendarCheck className="size-5" aria-hidden />
        {t("trial")}
      </Link>
      <a href={telegramLink("src_site_bar")} className={item} target="_blank" rel="noopener">
        <Send className="size-5" aria-hidden />
        {t("telegram")}
      </a>
    </nav>
  );
}
