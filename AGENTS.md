<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Zukkolab

- Yagona manba — TZ v1.1 (Claude Docs). Hujjatda yo'q narsa qurilmaydi; 0-bo'lim qarorlari ustun.
- Tillar: `uz` (lotin, `ʻ` U+02BB), `ru`, `en` — matnlar `messages/*.json`, kontent `*_uz/_ru/_en` ustunlarida.
- Brend va mijozga xos sozlamalar faqat `brand.config.ts`, `messages/`, `public/images/`, `supabase/seed.sql`.
- Next.js 16: `middleware.ts` emas, `proxy.ts`. Turlar: `pnpm typecheck` (`next typegen` bilan).
- Baza: `supabase/migrations/` (Supabase loyiha `ljtvsaofbtbwbmtjkpje`, Frankfurt). Demo maʼlumotlar: `select public.reset_demo_data()`.
- `SUPABASE_SERVICE_ROLE_KEY` faqat serverda (`lib/supabase/admin.ts`, `server-only`).
- Tekshiruv: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
