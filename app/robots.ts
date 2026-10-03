import type { MetadataRoute } from "next";
import { isDemoMode } from "@/lib/env";

const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

// NFR-05: demo rejimida butun sayt yopiq — to'qima ma'lumotlar qidiruvga tushmasin.
export default function robots(): MetadataRoute.Robots {
  if (isDemoMode()) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/*/rahmat", "/*/demo"] },
    sitemap: `${site}/sitemap.xml`,
  };
}
