"use client";

import { CalendarCheck, ClipboardCheck, MessageCircleQuestion, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { openAiChat } from "@/components/ai/events";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { telegramLink } from "@/lib/links";
import { cn } from "@/lib/utils";

// O'z asosiy tugmasi pastda yopishib turadigan sahifalar: u yerda panel takroriy va tugmani yopib qo'yardi.
const FLOW_PAGES = [/^\/sinov-darsi/, /^\/test\/[^/]+/, /^\/kurslar\/[^/]+/, /^\/rahmat/];

// Telefonda doim ko'rinadigan pastki panel (5-bo'lim): Test · Sinov darsi · Savol (AI) · Telegram.
export function BottomCtaBar() {
  const t = useTranslations("bottomBar");
  const pathname = usePathname();
  if (FLOW_PAGES.some((r) => r.test(pathname))) return null;
  const item = "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold";

  return (
    <nav
      aria-label={t("trial")}
      className="border-line bg-bg/95 fixed inset-x-0 bottom-0 z-40 flex border-t pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <Link href="/test" className={cn(item, pathname === "/test" && "text-brand")}>
        <ClipboardCheck className="size-5" aria-hidden />
        {t("test")}
      </Link>
      <Link href="/sinov-darsi" className={`${item} bg-cta m-1.5 rounded-xl`}>
        <CalendarCheck className="size-5" aria-hidden />
        {t("trial")}
      </Link>
      <button type="button" onClick={openAiChat} className={item} aria-haspopup="dialog">
        <MessageCircleQuestion className="size-5" aria-hidden />
        {t("ask")}
      </button>
      <a href={telegramLink("src_site_bar")} className={item} target="_blank" rel="noopener">
        <Send className="size-5" aria-hidden />
        {t("telegram")}
      </a>
    </nav>
  );
}
