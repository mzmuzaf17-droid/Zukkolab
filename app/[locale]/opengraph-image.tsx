import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { brand } from "@/brand.config";
import { ogFonts } from "@/lib/share/fonts";

// NFR-05: havola ulashilganda (Telegram, Instagram) chiqadigan rasm — har til uchun.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = brand.name;

const c = brand.colors;

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: c.ink,
        color: "#FFFFFF",
        padding: 72,
        fontFamily: "Manrope",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -160,
          right: -120,
          width: 520,
          height: 520,
          borderRadius: 9999,
          background: c.brand,
          opacity: 0.6,
        }}
      />
      <div style={{ display: "flex", alignItems: "center", fontFamily: "Unbounded", fontSize: 44 }}>
        <span>{brand.wordmark.first}</span>
        <span style={{ background: c.cta, color: c.ink, borderRadius: 12, padding: "0 12px", marginLeft: 6 }}>
          {brand.wordmark.second}
        </span>
      </div>
      <div style={{ display: "flex", fontFamily: "Unbounded", fontSize: 68, lineHeight: 1.1, maxWidth: 900 }}>
        {t("heroTitle")}
      </div>
      <div style={{ display: "flex" }}>
        <div
          style={{
            fontSize: 32,
            background: c.cta,
            color: c.ink,
            borderRadius: 18,
            padding: "16px 28px",
          }}
        >
          {t("heroPrimary")}
        </div>
      </div>
    </div>,
    { ...size, fonts: await ogFonts() },
  );
}
