import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BranchCard } from "@/components/site/branch-card";
import { getBranches } from "@/lib/data/content";
import { pick } from "@/lib/i18n/pick";
import type { Locale } from "@/lib/i18n/routing";

export const revalidate = 60;

export async function generateMetadata({ params }: PageProps<"/[locale]/filiallar">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return { title: t("branchesTitle") };
}

// OpenStreetMap — kalitsiz va bepul; xarita faqat ko'rinishga yaqinlashganda yuklanadi.
function mapEmbedUrl(points: { lat: number; lng: number }[]) {
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const pad = 0.02;
  const bbox = [
    Math.min(...lngs) - pad,
    Math.min(...lats) - pad,
    Math.max(...lngs) + pad,
    Math.max(...lats) + pad,
  ].join(",");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`;
}

export default async function BranchesPage({ params }: PageProps<"/[locale]/filiallar">) {
  const { locale: raw } = await params;
  const locale = raw as Locale;
  setRequestLocale(locale);
  const [t, branches] = await Promise.all([getTranslations("branches"), getBranches()]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:py-14">
      <h1 className="font-display text-[36px] leading-tight font-bold md:text-[48px]">{t("title")}</h1>
      <p className="text-muted mt-2 text-lg">{t("subtitle")}</p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {branches.map((b) => (
          <BranchCard key={b.id} branch={b} />
        ))}
      </div>
      {branches.length > 0 && (
        <iframe
          title={branches.map((b) => pick(b, "name", locale)).join(", ")}
          src={mapEmbedUrl(branches)}
          loading="lazy"
          className="border-line mt-8 aspect-[4/3] w-full rounded-[20px] border md:aspect-[21/9]"
        />
      )}
    </div>
  );
}
