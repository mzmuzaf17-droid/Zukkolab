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
```

## Ma'lumotlar bazasi

- Sxema: `supabase/migrations/`
- Kontent: `supabase/seed.sql` (filiallar, kurslar, o'qituvchilar, FAQ, 66 ta test savoli)
- Demo ma'lumotlar (guruhlar, slotlar, 40 ta lid, reklama xarajati): `select public.reset_demo_data();`
