import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { routing } from "@/lib/i18n/routing";
import { SOURCE_COOKIE, SOURCE_COOKIE_MAX_AGE, type SourceInfo } from "@/lib/leads/source";

const intl = createMiddleware(routing);
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content"] as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Birinchi tashrifdagi manba: UTM, ulashilgan test natijasi (?ref=) yoki tashqi referrer.
function firstTouch(req: NextRequest): SourceInfo | null {
  const params = req.nextUrl.searchParams;
  const info: SourceInfo = {};
  for (const key of UTM_KEYS) {
    const v = params.get(key);
    if (v) info[key] = v.slice(0, 200);
  }
  const ref = params.get("ref");
  if (ref && UUID.test(ref)) info.ref = ref;
  const referrer = req.headers.get("referer");
  if (referrer && !referrer.startsWith(req.nextUrl.origin)) info.referrer = referrer.slice(0, 500);
  return Object.keys(info).length ? info : null;
}

export default async function proxy(req: NextRequest) {
  // Panel: tilsiz; sessiyasiz foydalanuvchi login sahifasiga (FR-ADM-01, NFR-06).
  if (req.nextUrl.pathname.startsWith("/admin")) {
    const { res, user } = await updateSession(req);
    const isLogin = req.nextUrl.pathname.startsWith("/admin/login");
    if (!user && !isLogin) return NextResponse.redirect(new URL("/admin/login", req.url));
    if (user && isLogin) return NextResponse.redirect(new URL("/admin", req.url));
    return res;
  }

  const res = intl(req);
  const hasNewCampaign = req.nextUrl.searchParams.has("utm_source") || req.nextUrl.searchParams.has("ref");
  if (!req.cookies.has(SOURCE_COOKIE) || hasNewCampaign) {
    const info = firstTouch(req);
    if (info) {
      res.cookies.set(SOURCE_COOKIE, JSON.stringify(info), {
        maxAge: SOURCE_COOKIE_MAX_AGE,
        httpOnly: true,
        sameSite: "lax",
        secure: req.nextUrl.protocol === "https:",
        path: "/",
      });
    }
  }
  return res;
}

export const config = {
  // api, Next ichki fayllari va nuqtali fayllar (favicon.ico, .ics) proxy'dan o'tmaydi; /admin — alohida tarmoq.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
