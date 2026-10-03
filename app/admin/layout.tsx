import type { Metadata } from "next";
import { manrope, unbounded } from "@/lib/fonts";
import "../globals.css";

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s · Zukkolab panel" },
  robots: { index: false, follow: false },
};

// Panel — alohida root layout: tilsiz (o'zbekcha), sayt menyusisiz.
export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="uz" className={`${manrope.variable} ${unbounded.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
