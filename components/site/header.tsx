import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import { LanguageSwitcher } from "./language-switcher";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";

export async function Header() {
  const t = await getTranslations("nav");
  const tc = await getTranslations("cta");
  const items = [
    { href: "/kurslar", label: t("courses") },
    { href: "/test", label: t("test") },
    { href: "/filiallar", label: t("branches") },
    { href: "/#narxlar", label: t("prices") },
    { href: "/#savollar", label: t("faq") },
  ];

  return (
    <header className="border-line bg-bg/90 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Logo />
        <nav aria-label={t("menu")} className="hidden items-center gap-1 md:flex">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-ink/80 hover:text-ink rounded-lg px-3 py-2 text-[15px] font-medium"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher className="hidden md:flex" />
          <ButtonLink href="/sinov-darsi" size="sm" className="hidden sm:inline-flex">
            {tc("trialShort")}
          </ButtonLink>
          <MobileMenu items={items} />
        </div>
      </div>
    </header>
  );
}
