# Zukkolab

O'quv markazlar uchun demo tizim: sayt (uz/ru/en), Telegram Mini App va bot, menejer paneli.
"Reklama → ariza → sinov darsi → to'lov" yo'lini boshidan oxirigacha ko'rsatadi.

## Ishga tushirish

```bash
pnpm install
cp .env.example .env.local   # Supabase kalitlarini kiriting
pnpm dev                     # http://localhost:3000/uz
```

## Tekshiruv

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm test:e2e   # Playwright smoke-test: yozilish, test → story rasmi, AI, sarlavhalar (fixture rejimida)
```

Supabase'ga ulanmasdan ishlash: `DATA_SOURCE=fixture pnpm dev` (kontent `lib/data/fixtures/content.json` dan).

## Ma'lumotlar bazasi

- Sxema: `supabase/migrations/`
- Kontent: `supabase/seed.sql` (filiallar, kurslar, o'qituvchilar, FAQ, 66 ta test savoli)
- Demo ma'lumotlar (guruhlar, slotlar, 40 ta lid, reklama xarajati): `select public.reset_demo_data();`

## Ishga tushirish (Vercel) — tekshiruv ro'yxati

1. Vercel → Environment Variables (Production **va** Preview): `.env.example` dagi barcha kalitlar.
   Sirlarni (`SUPABASE_SERVICE_ROLE_KEY`, `TELEGRAM_BOT_TOKEN`, `CRON_SECRET`, `GEMINI_API_KEY`) hech kimga yubormang.
2. Supabase → SQL Editor: `supabase/migrations/` dagi barcha fayllar tartib bilan, keyin `select public.reset_demo_data();`.
3. Supabase → Authentication → Add user (admin), keyin `profiles` ga `role = 'admin'` qatori.
4. Telegram: `/api/telegram/setup?key=<TELEGRAM_WEBHOOK_SECRET>` — webhook, menyu va Mini App tugmasi.
   Botni menejerlar guruhiga qo'shib, guruhda `/setup` yozing.
5. Cron: `supabase/cron.sql` dagi `<CRON_SECRET>` ni o'z qiymatingizga almashtirib, SQL Editor'da ishga tushiring
   (har 5 daqiqada tick: SLA, eslatmalar, kunlik hisobot 09:00, AI suhbatlarini tozalash).
6. Tekshirish: `/uz/demo` QR → sinov darsiga yozilish → 30/60 soniyada Telegram eslatmalari → `/admin` da lid.
7. Haqiqiy mijoz uchun: `DEMO_MODE=false` (sayt qidiruvga ochiladi, Demo reset o'chadi), Turnstile haqiqiy kalitlari.

Brend va mijozga xos sozlamalar faqat: `brand.config.ts`, `messages/*.json`, `assets/fonts/`, `supabase/seed.sql`.
