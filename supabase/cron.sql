-- Har 5 daqiqada /api/jobs/tick (10-bo'lim). Migratsiya emas: CRON_SECRET'ni o'zingiz qo'yasiz.
-- Supabase → SQL Editor'da ishga tushiring; <CRON_SECRET> o'rniga Vercel'dagi qiymatni yozing.
-- Kalitni repo'ga commit qilmang.

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

select cron.unschedule('zukkolab-tick') where exists (select 1 from cron.job where jobname = 'zukkolab-tick');

select cron.schedule(
  'zukkolab-tick',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://zukkolab.vercel.app/api/jobs/tick',
    headers := jsonb_build_object('Authorization', 'Bearer <CRON_SECRET>', 'Content-Type', 'application/json'),
    timeout_milliseconds := 30000
  );
  $$
);

-- Tekshirish: select * from cron.job_run_details order by start_time desc limit 5;
