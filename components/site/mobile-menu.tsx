"use client";

import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { buttonClass } from "@/components/ui/button";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { LanguageSwitcher } from "./language-switcher";

type NavItem = { href: string; label: string };

export function MobileMenu({ items }: { items: NavItem[] }) {
  // Menyu qaysi sahifada ochilgan bo'lsa, faqat o'sha sahifada ochiq turadi — o'tishda o'zi yopiladi.
  const pathname = usePathname();
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const open = openedAt === pathname;
  const setOpen = (value: boolean) => setOpenedAt(value ? pathname : null);
  const t = useTranslations();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("nav.openMenu")}
        aria-expanded={open}
        className="hover:bg-ink/5 inline-flex size-11 items-center justify-center rounded-xl"
      >
        <Menu className="size-6" aria-hidden />
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("nav.menu")}
          className="bg-bg fixed inset-0 z-50 flex flex-col p-4"
        >
          <div className="flex items-center justify-between">
            <LanguageSwitcher />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t("nav.closeMenu")}
              className="hover:bg-ink/5 inline-flex size-11 items-center justify-center rounded-xl"
            >
              <X className="size-6" aria-hidden />
            </button>
          </div>
          <nav className="mt-6 flex flex-col">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="font-display border-line border-b py-4 text-2xl font-semibold"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Link href="/sinov-darsi" className={buttonClass("primary", "lg", "mt-auto w-full")}>
            {t("cta.trial")}
          </Link>
        </div>
      )}
    </div>
  );
}
