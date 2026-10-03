import { useTranslations } from "next-intl";

export function DemoBanner() {
  const t = useTranslations("demo");
  return (
    <div className="bg-ink px-4 py-1.5 text-center text-xs font-medium text-white" role="note">
      {t("banner")}
    </div>
  );
}
