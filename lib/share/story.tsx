import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { brand } from "@/brand.config";

// v1.1, 4-qaror: ulashiladigan test natijasi — Instagram story o'lchami.
export const STORY_SIZE = { width: 1080, height: 1920 };

// Shriftlar bir marta o'qiladi (Unbounded'da ʻ U+02BB bor — Manrope'da yo'q, satori Unbounded'dan oladi).
const fonts = Promise.all([
  readFile(join(process.cwd(), "assets/fonts/Unbounded-Bold.ttf")),
  readFile(join(process.cwd(), "assets/fonts/Manrope-SemiBold.ttf")),
]);

export type StoryCard = {
  kicker: string;
  direction: string;
  label: string;
  score: string | null;
  explanation: string;
  challenge: string;
  free: string;
};

const c = brand.colors;

export async function renderStory(card: StoryCard): Promise<ImageResponse> {
  const [unbounded, manrope] = await fonts;
  const site = brand.siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  // Unbounded keng shrift: eng uzun so'z ≈ 800 px ga sig'adigan o'lcham (Олимпиадный, Boshlangʻich).
  const longestWord = Math.max(...card.label.split(/\s+/).map((w) => w.length));
  const charWidth = /[а-яё]/i.test(card.label) ? 1 : 0.82;
  const labelSize = Math.min(180, Math.floor(800 / (longestWord * charWidth)));

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: c.ink,
        color: "#FFFFFF",
        padding: "120px 96px 110px",
        fontFamily: "Manrope",
        position: "relative",
      }}
    >
      {/* Fon bezaklari */}
      <div
        style={{
          position: "absolute",
          top: -220,
          right: -260,
          width: 760,
          height: 760,
          borderRadius: 9999,
          background: c.brand,
          opacity: 0.55,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 360,
          left: -180,
          width: 360,
          height: 360,
          borderRadius: 9999,
          border: `28px solid ${c.coral}`,
          opacity: 0.8,
        }}
      />

      <div style={{ display: "flex", alignItems: "center", fontFamily: "Unbounded", fontSize: 64 }}>
        <span>{brand.wordmark.first}</span>
        <span style={{ background: c.cta, color: c.ink, borderRadius: 18, padding: "0 18px", marginLeft: 8 }}>
          {brand.wordmark.second}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", marginTop: 300 }}>
        <div style={{ fontSize: 44, color: "rgba(255,255,255,0.65)" }}>
          {`${card.kicker} · ${card.direction}`}
        </div>
        <div style={{ display: "flex", marginTop: 40 }}>
          <div
            style={{
              display: "flex",
              fontFamily: "Unbounded",
              fontSize: labelSize,
              lineHeight: 1.1,
              background: c.cta,
              color: c.ink,
              borderRadius: 40,
              padding: "24px 48px",
              transform: "rotate(-3deg)",
            }}
          >
            {card.label}
          </div>
        </div>
        {card.score && (
          <div style={{ fontSize: 48, marginTop: 64, color: "rgba(255,255,255,0.85)" }}>{card.score}</div>
        )}
        <div
          style={{
            fontSize: 46,
            lineHeight: 1.4,
            marginTop: 40,
            maxWidth: 860,
            color: "rgba(255,255,255,0.9)",
          }}
        >
          {card.explanation}
        </div>
      </div>

      <div
        style={{
          marginTop: "auto",
          display: "flex",
          flexDirection: "column",
          background: "#FFFFFF",
          color: c.ink,
          borderRadius: 48,
          padding: "56px 64px",
        }}
      >
        <div style={{ fontFamily: "Unbounded", fontSize: 54, lineHeight: 1.2 }}>{card.challenge}</div>
        <div style={{ fontSize: 40, marginTop: 24, color: c.muted }}>{card.free}</div>
        <div style={{ display: "flex", marginTop: 36 }}>
          <div
            style={{
              fontFamily: "Unbounded",
              fontSize: 40,
              background: c.brand,
              color: "#FFFFFF",
              borderRadius: 24,
              padding: "18px 32px",
            }}
          >
            {`${site}/test`}
          </div>
        </div>
      </div>
    </div>,
    {
      ...STORY_SIZE,
      fonts: [
        { name: "Manrope", data: manrope, weight: 600, style: "normal" },
        { name: "Unbounded", data: unbounded, weight: 700, style: "normal" },
      ],
    },
  );
}
