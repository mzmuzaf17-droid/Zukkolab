import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import QRCode from "qrcode";
import { isDemoMode } from "@/lib/env";

export const metadata: Metadata = { robots: { index: false } };

// v1.1, 2-qaror: uchrashuvda ekranga chiqariladigan QR. Shu yo'l bilan yozilgan bron "tezlashtirilgan":
// eslatmalar 24 soat/2 soat o'rniga 30/60 soniyada keladi — markaz egasi butun zanjirni 2 daqiqada ko'radi.
export default async function DemoQrPage({ params }: PageProps<"/[locale]/demo">) {
  if (!isDemoMode()) notFound();
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("demo");

  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const url = `${site}/${locale}/sinov-darsi?demo=1&utm_source=demo`;
  const svg = await QRCode.toString(url, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#14121F", light: "#FFFFFF" },
  });

  return (
    <div className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-10 px-4 py-10 md:grid-cols-[minmax(0,420px)_1fr] md:py-16">
      <div
        className="border-line mx-auto aspect-square w-full max-w-[420px] rounded-[28px] border bg-white p-5 shadow-sm [&>svg]:size-full"
        role="img"
        aria-label={url}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <div className="space-y-6">
        <h1 className="font-display text-[32px] leading-tight font-bold md:text-[48px]">{t("qrTitle")}</h1>
        <p className="text-muted text-lg">{t("qrText")}</p>
        <ol className="space-y-3">
          {(["step1", "step2", "step3"] as const).map((k, i) => (
            <li key={k} className="flex items-center gap-3 text-lg font-semibold">
              <span className="bg-cta font-display grid size-9 shrink-0 place-items-center rounded-full">
                {i + 1}
              </span>
              {t(k)}
            </li>
          ))}
        </ol>
        <p className="text-sm">
          {t("openLink")}:{" "}
          <a href={url} className="text-brand font-semibold break-all underline">
            {url.replace(/^https?:\/\//, "")}
          </a>
        </p>
      </div>
    </div>
  );
}
