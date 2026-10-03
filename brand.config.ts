// Yangi mijozga moslashtirishda shu fayl, messages/*.json, rasmlar va seed o'zgaradi — kod emas.
export const brand = {
  name: "Zukkolab",
  wordmark: { first: "Zukko", second: "lab" },
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  telegramBot: process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? "oquvmarkaz_dbot",
  phone: "+998712000000",
  email: "info@zukkolab.uz",
  social: {
    instagram: "https://instagram.com/zukkolab",
    telegram: "https://t.me/zukkolab",
    youtube: "https://youtube.com/@zukkolab",
  },
  timeZone: "Asia/Tashkent",
  currency: "UZS",
  colors: {
    bg: "#FAFAF7",
    ink: "#14121F",
    brand: "#6D4AFF",
    cta: "#C6F432",
    coral: "#FF6B57",
    muted: "#6B6880",
    line: "#E7E5EE",
  },
  // Yo'qotilgan daromad hisobida o'quvchi o'rtacha necha oy o'qishi (TZ v1.1, 3-qaror).
  avgStudyMonths: 6,
} as const;

export type Brand = typeof brand;
