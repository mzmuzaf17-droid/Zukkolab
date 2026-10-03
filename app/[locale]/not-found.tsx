import { useTranslations } from "next-intl";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  const t = useTranslations("catalog");
  const tn = useTranslations("nav");
  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center">
      <p className="font-display text-6xl font-bold">404</p>
      <p className="text-muted">{t("empty")}</p>
      <ButtonLink href="/" variant="secondary">
        {tn("home")}
      </ButtonLink>
    </div>
  );
}
