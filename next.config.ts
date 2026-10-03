import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts");

const isDev = process.env.NODE_ENV !== "production";

// NFR-06: CSP. Tashqi manbalar: Turnstile (Cloudflare), Telegram Mini App skripti, Supabase (REST + Realtime),
// OpenStreetMap xaritasi. Next.js inline skriptlari uchun 'unsafe-inline' (nonce sahifalarni dinamik qilardi).
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://challenges.cloudflare.com https://telegram.org`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com",
  "frame-src https://challenges.cloudflare.com https://www.openstreetmap.org",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // Sayt Telegram Web ichida Mini App sifatida ochiladi (v1.1, 1-qaror) — faqat Telegram ramkaga oladi.
  "frame-ancestors 'self' https://web.telegram.org https://*.telegram.org",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

// Panel hech qayerda ramkaga olinmaydi.
const adminHeaders = [
  { key: "Content-Security-Policy", value: csp.replace(/frame-ancestors [^;]+/, "frame-ancestors 'none'") },
  { key: "X-Frame-Options", value: "DENY" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Story rasmi shriftlari serverless funksiyaga qo'shiladi.
  outputFileTracingIncludes: {
    "/api/share/[attemptId]": ["./assets/fonts/**"],
    "/[locale]/opengraph-image": ["./assets/fonts/**"],
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/admin/:path*", headers: adminHeaders },
      { source: "/admin", headers: adminHeaders },
    ];
  },
};

export default withNextIntl(nextConfig);
