import type { MetadataRoute } from "next";
import { getCourses, getDirections } from "@/lib/data/content";
import { locales } from "@/lib/i18n/routing";

const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

// NFR-05: barcha ochiq sahifalar uch tilda, hreflang muqobillari bilan.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [courses, directions] = await Promise.all([getCourses(), getDirections()]);
  const paths = [
    "",
    "/kurslar",
    "/test",
    "/sinov-darsi",
    "/filiallar",
    "/maxfiylik",
    ...courses.map((c) => `/kurslar/${c.slug}`),
    ...directions.map((d) => `/test/${d.slug}`),
  ];
  return paths.flatMap((path) =>
    locales.map((locale) => ({
      url: `${site}/${locale}${path}`,
      changeFrequency: path ? ("weekly" as const) : ("daily" as const),
      priority: path ? 0.7 : 1,
      alternates: { languages: Object.fromEntries(locales.map((l) => [l, `${site}/${l}${path}`])) },
    })),
  );
}
