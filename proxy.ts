import createMiddleware from "next-intl/middleware";
import { routing } from "@/lib/i18n/routing";

// Hozircha faqat til yo'naltirish; /admin himoyasi panel bosqichida qo'shiladi.
export default createMiddleware(routing);

export const config = {
  // api, admin, Next ichki fayllari va nuqtali fayllar (favicon.ico, .ics) tilsiz qoladi.
  matcher: ["/((?!api|admin|_next|_vercel|.*\\..*).*)"],
};
