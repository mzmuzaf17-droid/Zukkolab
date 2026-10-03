import { Manrope, Unbounded } from "next/font/google";

// Faqat lotin shrifti oldindan yuklanadi (uz/en; ʻ U+02BB lotin to'plamida). Kirill fayllari unicode-range orqali
// faqat ruscha sahifada kerak bo'lganda yuklanadi.

export const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});
