import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./types";

// /admin uchun: sessiya cookie'larini yangilaydi va foydalanuvchini qaytaradi (optimistik tekshiruv;
// haqiqiy rol tekshiruvi har bir sahifa va server action'da).
export async function updateSession(req: NextRequest) {
  let res = NextResponse.next({ request: req });
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (toSet) => {
          for (const { name, value } of toSet) req.cookies.set(name, value);
          res = NextResponse.next({ request: req });
          for (const { name, value, options } of toSet) res.cookies.set(name, value, options);
        },
      },
    },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { res, user };
}
