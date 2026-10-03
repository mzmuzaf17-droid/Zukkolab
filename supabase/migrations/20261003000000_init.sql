-- Zukkolab — boshlang'ich sxema (TZ v1.1, 4-bo'lim + 0-bo'lim qarorlari).
-- Matnli kontent uch tilda: *_uz, *_ru, *_en. Test savollari va variantlari — {uz,ru,en} jsonb.

create extension if not exists pg_trgm with schema extensions;

-- ───────────────────────── Enum turlari ─────────────────────────
create type public.lead_status as enum ('new', 'contacted', 'trial_booked', 'trial_attended', 'paid', 'lost');
create type public.booking_status as enum ('booked', 'attended', 'no_show', 'cancelled');
create type public.channel as enum ('web', 'telegram', 'miniapp');
create type public.user_role as enum ('admin', 'manager');
create type public.locale as enum ('uz', 'ru', 'en');
create type public.lost_reason as enum ('expensive', 'far', 'schedule', 'no_answer', 'other');
create type public.age_group as enum ('kids', 'teens', 'adults');

-- ───────────────────────── Umumiy trigger ─────────────────────────
create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ───────────────────────── Texnik jadvallar ─────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role public.user_role not null default 'manager',
  tg_user_id bigint unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.settings (
  key text primary key,
  value jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Rol tekshiruvlari RLS ichida ishlatiladi; security definer — profiles RLS'iga qayta kirmaslik uchun.
create function public.current_role_name() returns public.user_role
language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = auth.uid() and is_active
$$;

create function public.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and is_active)
$$;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and is_active and role = 'admin')
$$;

-- ───────────────────────── Kontent jadvallari ─────────────────────────
create table public.branches (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_uz text not null, name_ru text not null, name_en text not null,
  address_uz text not null, address_ru text not null, address_en text not null,
  landmark_uz text, landmark_ru text, landmark_en text,
  lat double precision not null,
  lng double precision not null,
  phone text not null,
  working_hours_uz text not null, working_hours_ru text not null, working_hours_en text not null,
  photo_url text,
  is_active boolean not null default true,
  sort smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.directions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_uz text not null, name_ru text not null, name_en text not null,
  icon text not null,
  color text not null,
  has_test boolean not null default true,
  is_active boolean not null default true,
  sort smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Daraja — 1..4 butun son; har yo'nalish uchun nomlari ilovada (A1–A2/B1/B2/C1, Boshlang'ich…Olimpiada).
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  direction_id uuid not null references public.directions (id),
  slug text not null unique,
  title_uz text not null, title_ru text not null, title_en text not null,
  description_uz text not null, description_ru text not null, description_en text not null,
  program_uz text[] not null default '{}', program_ru text[] not null default '{}', program_en text[] not null default '{}',
  level_from smallint not null default 1 check (level_from between 1 and 4),
  level_to smallint not null default 4 check (level_to between 1 and 4),
  age_group public.age_group not null,
  duration_months smallint not null check (duration_months > 0),
  lessons_per_week smallint not null check (lessons_per_week > 0),
  lesson_minutes smallint not null check (lesson_minutes > 0),
  price_monthly integer not null check (price_monthly >= 0),
  is_featured boolean not null default false,
  is_active boolean not null default true,
  sort smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (level_from <= level_to)
);

create table public.teachers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  photo_url text,
  direction_id uuid not null references public.directions (id),
  experience_years smallint not null default 0,
  certificates text[] not null default '{}',
  bio_uz text not null, bio_ru text not null, bio_en text not null,
  video_url text,
  is_active boolean not null default true,
  sort smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  branch_id uuid not null references public.branches (id),
  teacher_id uuid references public.teachers (id) on delete set null,
  start_date date not null,
  schedule_text_uz text not null, schedule_text_ru text not null, schedule_text_en text not null,
  capacity smallint not null check (capacity > 0),
  enrolled_count smallint not null default 0 check (enrolled_count >= 0),
  is_open boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.trial_slots (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches (id),
  direction_id uuid not null references public.directions (id),
  starts_at timestamptz not null,
  duration_min smallint not null default 60,
  capacity smallint not null check (capacity > 0),
  booked_count smallint not null default 0 check (booked_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (branch_id, direction_id, starts_at),
  check (booked_count <= capacity)
);

-- question: {"uz","ru","en"}; options: [{"key","text":{"uz","ru","en"},"scores"?:{track:ball}}].
-- correct_key va scores ochiq API'ga hech qachon chiqmaydi: anon bu jadvalni umuman o'qiy olmaydi.
create table public.test_questions (
  id uuid primary key default gen_random_uuid(),
  direction_id uuid not null references public.directions (id),
  level smallint not null check (level between 1 and 4),
  question jsonb not null,
  options jsonb not null,
  correct_key text,
  weight smallint not null default 1,
  is_active boolean not null default true,
  sort smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.faq (
  id uuid primary key default gen_random_uuid(),
  question_uz text not null, question_ru text not null, question_en text not null,
  answer_uz text not null, answer_ru text not null, answer_en text not null,
  is_active boolean not null default true,
  sort smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  achievement_uz text not null, achievement_ru text not null, achievement_en text not null,
  text_uz text not null, text_ru text not null, text_en text not null,
  photo_url text,
  video_url text,
  direction_id uuid references public.directions (id),
  is_demo boolean not null default true,
  is_active boolean not null default true,
  sort smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ───────────────────────── Operatsion jadvallar ─────────────────────────
-- Lid — kontakt (ota-ona yoki o'quvchining o'zi); o'quvchilar alohida (v1.1, 6-qaror).
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null check (phone ~ '^\+998\d{9}$'),
  locale public.locale not null default 'uz',
  channel public.channel not null default 'web',
  direction_id uuid references public.directions (id),
  course_id uuid references public.courses (id),
  status public.lead_status not null default 'new',
  lost_reason public.lost_reason,
  assigned_to uuid references public.profiles (id) on delete set null,
  test_attempt_id uuid,
  -- source — hisobotdagi normallashgan manba (instagram, telegram, referral, google, direct…); ad_spend.source bilan mos.
  source text not null default 'direct',
  utm_source text, utm_medium text, utm_campaign text, utm_content text,
  referrer text,
  ref_attempt_id uuid,
  tg_chat_id bigint,
  tg_username text,
  operator_requested boolean not null default false,
  is_demo_live boolean not null default false,
  group_notified_at timestamptz,
  sla_alerted_at timestamptz,
  sla_escalated_at timestamptz,
  first_contact_at timestamptz,
  paid_at timestamptz,
  paid_amount integer check (paid_amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'lost' or lost_reason is not null)
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  full_name text not null,
  age smallint check (age between 3 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index students_lead_name_key on public.students (lead_id, lower(full_name));

create table public.lead_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  type text not null,
  from_status public.lead_status,
  to_status public.lead_status,
  actor_id uuid references public.profiles (id) on delete set null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  student_id uuid references public.students (id) on delete set null,
  slot_id uuid not null references public.trial_slots (id),
  status public.booking_status not null default 'booked',
  tg_chat_id bigint,
  -- Demo vaqt tezlatgichi: eslatmalar 30/60 soniyada (v1.1, 2-qaror).
  demo_accelerated boolean not null default false,
  reminder_24h_sent_at timestamptz,
  reminder_2h_sent_at timestamptz,
  followup_sent_at timestamptz,
  feedback_score smallint check (feedback_score between 1 and 5),
  feedback_alerted_at timestamptz,
  confirmed_at timestamptz,
  cancel_token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.test_attempts (
  id uuid primary key default gen_random_uuid(),
  direction_id uuid not null references public.directions (id),
  lead_id uuid references public.leads (id) on delete set null,
  session_id text not null,
  question_ids uuid[] not null,
  answers jsonb not null default '{}',
  score smallint,
  max_score smallint,
  result_level smallint check (result_level between 1 and 4),
  result_track text,
  recommended_course_id uuid references public.courses (id),
  channel public.channel not null default 'web',
  locale public.locale not null default 'uz',
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.leads
  add constraint leads_test_attempt_fk foreign key (test_attempt_id) references public.test_attempts (id) on delete set null,
  add constraint leads_ref_attempt_fk foreign key (ref_attempt_id) references public.test_attempts (id) on delete set null;

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  channel public.channel not null default 'web',
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create table public.tg_sessions (
  chat_id bigint primary key,
  state jsonb not null default '{}',
  locale public.locale not null default 'uz',
  lead_id uuid references public.leads (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Reklama xarajati: CAC va ROMI uchun (v1.1, 3-qaror).
create table public.ad_spend (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  week_start date not null check (extract(isodow from week_start) = 1),
  amount integer not null check (amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, week_start)
);

-- ───────────────────────── Indekslar ─────────────────────────
create index leads_status_created_idx on public.leads (status, created_at desc);
create index leads_phone_idx on public.leads (phone);
create index leads_source_idx on public.leads (source);
create index leads_assigned_idx on public.leads (assigned_to);
create index lead_events_lead_idx on public.lead_events (lead_id, created_at desc);
create index trial_slots_starts_idx on public.trial_slots (starts_at);
create index bookings_slot_idx on public.bookings (slot_id);
create index bookings_lead_idx on public.bookings (lead_id);
create index test_questions_dir_level_idx on public.test_questions (direction_id, level) where is_active;
create index ai_messages_session_idx on public.ai_messages (session_id, created_at);
create index courses_direction_idx on public.courses (direction_id);
create index groups_course_idx on public.groups (course_id, start_date);
-- FAQ rejimidagi AI qidiruvi uchun (9-bo'lim).
create index faq_trgm_uz_idx on public.faq using gin ((question_uz || ' ' || answer_uz) extensions.gin_trgm_ops);
create index faq_trgm_ru_idx on public.faq using gin ((question_ru || ' ' || answer_ru) extensions.gin_trgm_ops);
create index faq_trgm_en_idx on public.faq using gin ((question_en || ' ' || answer_en) extensions.gin_trgm_ops);

-- ───────────────────────── updated_at triggerlari ─────────────────────────
do $$
declare t text;
begin
  foreach t in array array['profiles','settings','branches','directions','courses','teachers','groups',
    'trial_slots','test_questions','faq','testimonials','leads','students','bookings','test_attempts',
    'tg_sessions','ad_spend']
  loop
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- ───────────────────────── Biznes qoidalari ─────────────────────────
-- Holat faqat ruxsat etilgan yo'nalishda o'zgaradi (8-bo'lim diagrammasi); tarix lead_events'ga yoziladi.
create function public.lead_status_allowed(from_s public.lead_status, to_s public.lead_status) returns boolean
language sql immutable set search_path = '' as $$
  select case
    when from_s = to_s then true
    when to_s = 'lost' then from_s <> 'paid'
    when from_s = 'new' then to_s in ('contacted', 'trial_booked')
    when from_s = 'contacted' then to_s = 'trial_booked'
    when from_s = 'trial_booked' then to_s in ('trial_attended', 'contacted')
    when from_s = 'trial_attended' then to_s = 'paid'
    else false
  end
$$;

create function public.leads_before_update() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.status is distinct from old.status then
    if not public.lead_status_allowed(old.status, new.status) then
      raise exception 'INVALID_TRANSITION: % -> %', old.status, new.status using errcode = 'P0001';
    end if;
    if old.status = 'new' and new.first_contact_at is null then
      new.first_contact_at := now();
    end if;
    if new.status = 'paid' and new.paid_at is null then
      new.paid_at := now();
    end if;
    if new.status <> 'lost' then
      new.lost_reason := null;
    end if;
  end if;
  return new;
end $$;

create trigger leads_before_update before update on public.leads
  for each row execute function public.leads_before_update();

create function public.leads_after_update() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status is distinct from old.status then
    insert into public.lead_events (lead_id, type, from_status, to_status, actor_id, payload)
    values (new.id, 'status_changed', old.status, new.status, auth.uid(),
            case when new.status = 'lost' then jsonb_build_object('reason', new.lost_reason) else '{}'::jsonb end);
  end if;
  if new.assigned_to is distinct from old.assigned_to and new.assigned_to is not null then
    insert into public.lead_events (lead_id, type, actor_id, payload)
    values (new.id, 'assigned', auth.uid(), jsonb_build_object('assigned_to', new.assigned_to));
  end if;
  return new;
end $$;

create trigger leads_after_update after update on public.leads
  for each row execute function public.leads_after_update();

create function public.leads_after_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.lead_events (lead_id, type, to_status, payload)
  values (new.id, 'created', new.status, jsonb_build_object('channel', new.channel, 'source', new.source));
  return new;
end $$;

create trigger leads_after_insert after insert on public.leads
  for each row execute function public.leads_after_insert();

-- Ortiqcha bron yo'q: joy bitta atomar UPDATE bilan olinadi. Xatolar: SLOT_FULL, ALREADY_BOOKED.
create function public.book_trial(
  p_slot_id uuid,
  p_lead_id uuid,
  p_student_id uuid default null,
  p_demo_accelerated boolean default false
) returns public.bookings
language plpgsql security definer set search_path = '' as $$
declare
  v_slot public.trial_slots;
  v_booking public.bookings;
begin
  select * into v_slot from public.trial_slots where id = p_slot_id;
  if not found then
    raise exception 'SLOT_NOT_FOUND' using errcode = 'P0001';
  end if;

  -- Bitta o'quvchi bitta yo'nalishga faqat bitta faol bronga ega (aka-uka bitta telefon bilan yozila oladi).
  if exists (
    select 1 from public.bookings b
    join public.trial_slots s on s.id = b.slot_id
    where b.lead_id = p_lead_id
      and b.student_id is not distinct from p_student_id
      and b.status = 'booked'
      and s.direction_id = v_slot.direction_id
      and s.starts_at > now()
  ) then
    raise exception 'ALREADY_BOOKED' using errcode = 'P0001';
  end if;

  update public.trial_slots
     set booked_count = booked_count + 1
   where id = p_slot_id
     and booked_count < capacity
     and starts_at > now()
  returning * into v_slot;
  if not found then
    raise exception 'SLOT_FULL' using errcode = 'P0001';
  end if;

  insert into public.bookings (lead_id, student_id, slot_id, demo_accelerated)
  values (p_lead_id, p_student_id, p_slot_id, p_demo_accelerated)
  returning * into v_booking;

  update public.leads
     set status = 'trial_booked',
         direction_id = coalesce(direction_id, v_slot.direction_id)
   where id = p_lead_id and status in ('new', 'contacted');

  insert into public.lead_events (lead_id, type, payload)
  values (p_lead_id, 'trial_booked', jsonb_build_object('booking_id', v_booking.id, 'slot_id', p_slot_id, 'starts_at', v_slot.starts_at));

  return v_booking;
end $$;

-- Bron bekor qilinsa yoki boshqa slotga o'tsa, joy qaytariladi.
create function public.bookings_after_update() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.status <> 'cancelled' and new.status = 'cancelled' then
    update public.trial_slots set booked_count = greatest(booked_count - 1, 0) where id = old.slot_id;
  end if;
  if new.status = 'attended' and old.status <> 'attended' then
    update public.leads set status = 'trial_attended' where id = new.lead_id and status = 'trial_booked';
  end if;
  if new.status = 'no_show' and old.status <> 'no_show' then
    update public.leads set status = 'contacted' where id = new.lead_id and status = 'trial_booked';
  end if;
  return new;
end $$;

create trigger bookings_after_update after update on public.bookings
  for each row execute function public.bookings_after_update();

-- ───────────────────────── RLS ─────────────────────────
alter table public.profiles enable row level security;
alter table public.settings enable row level security;
alter table public.branches enable row level security;
alter table public.directions enable row level security;
alter table public.courses enable row level security;
alter table public.teachers enable row level security;
alter table public.groups enable row level security;
alter table public.trial_slots enable row level security;
alter table public.test_questions enable row level security;
alter table public.faq enable row level security;
alter table public.testimonials enable row level security;
alter table public.leads enable row level security;
alter table public.students enable row level security;
alter table public.lead_events enable row level security;
alter table public.bookings enable row level security;
alter table public.test_attempts enable row level security;
alter table public.ai_messages enable row level security;
alter table public.tg_sessions enable row level security;
alter table public.ad_spend enable row level security;

-- Ochiq kontent: hamma o'qiydi (faqat faol), admin yozadi.
create policy "public read" on public.branches for select using (is_active or public.is_staff());
create policy "public read" on public.directions for select using (is_active or public.is_staff());
create policy "public read" on public.courses for select using (is_active or public.is_staff());
create policy "public read" on public.teachers for select using (is_active or public.is_staff());
create policy "public read" on public.faq for select using (is_active or public.is_staff());
create policy "public read" on public.testimonials for select using (is_active or public.is_staff());
create policy "public read" on public.groups for select using (is_open or public.is_staff());
create policy "public read" on public.trial_slots for select using (starts_at > now() or public.is_staff());

create policy "admin write" on public.branches for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin write" on public.directions for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin write" on public.courses for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin write" on public.teachers for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin write" on public.faq for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin write" on public.testimonials for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin write" on public.groups for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin write" on public.trial_slots for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin all" on public.test_questions for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Operatsion: menejer o'qiydi va yangilaydi; o'chirish faqat admin.
create policy "staff read" on public.leads for select to authenticated using (public.is_staff());
create policy "staff update" on public.leads for update to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "admin delete" on public.leads for delete to authenticated using (public.is_admin());

create policy "staff read" on public.students for select to authenticated using (public.is_staff());
create policy "staff write" on public.students for update to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "staff read" on public.lead_events for select to authenticated using (public.is_staff());
create policy "staff note" on public.lead_events for insert to authenticated
  with check (public.is_staff() and type = 'note' and actor_id = auth.uid());

create policy "staff read" on public.bookings for select to authenticated using (public.is_staff());
create policy "staff update" on public.bookings for update to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "staff read" on public.test_attempts for select to authenticated using (public.is_staff());

create policy "staff read" on public.profiles for select to authenticated using (public.is_staff() or id = auth.uid());
create policy "admin write" on public.profiles for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "staff read" on public.settings for select to authenticated using (public.is_staff());
create policy "admin write" on public.settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "admin all" on public.ad_spend for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ai_messages va tg_sessions: faqat server (service_role); siyosat yo'q = anon/authenticated uchun yopiq.

-- Funksiyalarni faqat server chaqiradi.
revoke execute on function public.book_trial(uuid, uuid, uuid, boolean) from public, anon, authenticated;

-- ───────────────────────── Realtime ─────────────────────────
-- Panelda yangi lidlar sahifani yangilamasdan chiqadi (FR-ADM-07).
alter publication supabase_realtime add table public.leads;
