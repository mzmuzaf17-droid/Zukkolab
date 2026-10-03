-- Demo reset (TZ v1.1: P0). Kontentga tegmaydi; guruhlar, slotlar, lidlar, bronlar va reklama xarajatlarini
-- bugungi sanaga nisbatan qayta yaratadi. Faqat server (service_role) chaqiradi — admin tekshiruvidan keyin.
create function public.reset_demo_data() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_tz constant text := 'Asia/Tashkent';
  v_today date := (now() at time zone v_tz)::date;
  v_codes constant text[] := array['90', '91', '93', '94', '95', '97', '99', '88', '33', '50'];
  v_sched_uz constant text[] := array['Du, Chor, Ju · 15:00–16:30', 'Se, Pa, Sha · 18:00–19:30', 'Du, Chor, Ju · 10:00–11:30', 'Se, Pa, Sha · 15:00–16:30'];
  v_sched_ru constant text[] := array['Пн, Ср, Пт · 15:00–16:30', 'Вт, Чт, Сб · 18:00–19:30', 'Пн, Ср, Пт · 10:00–11:30', 'Вт, Чт, Сб · 15:00–16:30'];
  v_sched_en constant text[] := array['Mon, Wed, Fri · 15:00–16:30', 'Tue, Thu, Sat · 18:00–19:30', 'Mon, Wed, Fri · 10:00–11:30', 'Tue, Thu, Sat · 15:00–16:30'];
  v_branches uuid[];
  r record;
  v_i int := 0;
  v_lead_id uuid;
  v_student_id uuid;
  v_dir_id uuid;
  v_course_id uuid;
  v_price int;
  v_created timestamptz;
  v_contact timestamptz;
  v_slot_id uuid;
  v_slot_at timestamptz;
  v_attempt_id uuid;
  v_branch uuid;
begin
  perform setseed(0.17);

  delete from public.bookings where true;
  delete from public.students where true;
  delete from public.lead_events where true;
  delete from public.leads where true;
  delete from public.test_attempts where true;
  delete from public.ai_messages where true;
  delete from public.tg_sessions where true;
  delete from public.trial_slots where true;
  delete from public.groups where true;
  delete from public.ad_spend where true;

  select array_agg(id order by sort) into v_branches from public.branches where is_active;

  -- Guruhlar: har kursga 2 ta; birinchisida 1–3 joy qolgan ("3 joy qoldi" belgisi uchun).
  for r in
    select c.id, c.sort, c.direction_id,
           (select t.id from public.teachers t where t.direction_id = c.direction_id
             order by t.sort offset (c.sort % greatest((select count(*) from public.teachers t2 where t2.direction_id = c.direction_id), 1)) limit 1) as teacher_id
      from public.courses c where c.is_active order by c.sort
  loop
    insert into public.groups (course_id, branch_id, teacher_id, start_date, schedule_text_uz, schedule_text_ru, schedule_text_en, capacity, enrolled_count)
    values
      (r.id, v_branches[1 + r.sort % array_length(v_branches, 1)], r.teacher_id, v_today + 3 + (r.sort * 5) % 12,
       v_sched_uz[1 + r.sort % 4], v_sched_ru[1 + r.sort % 4], v_sched_en[1 + r.sort % 4], 12, 9 + (r.sort % 3)),
      (r.id, v_branches[1 + (r.sort + 1) % array_length(v_branches, 1)], r.teacher_id, v_today + 17 + (r.sort * 3) % 10,
       v_sched_uz[1 + (r.sort + 1) % 4], v_sched_ru[1 + (r.sort + 1) % 4], v_sched_en[1 + (r.sort + 1) % 4], 12, 3 + (r.sort % 5));
  end loop;

  -- Sinov darsi slotlari: keyingi 14 kun, yakshanbadan tashqari, 10:00 / 15:00 / 18:00 (Toshkent).
  insert into public.trial_slots (branch_id, direction_id, starts_at, duration_min, capacity, booked_count)
  select b.id, d.id, ((v_today + g.day)::timestamp + t.at) at time zone v_tz, 60, 6, floor(random() * 5)::smallint
    from public.branches b
    cross join public.directions d
    cross join generate_series(0, 13) as g(day)
    cross join (values (time '10:00'), (time '15:00'), (time '18:00')) as t(at)
   where b.is_active and d.is_active
     and extract(isodow from v_today + g.day) <> 7
     and ((v_today + g.day)::timestamp + t.at) at time zone v_tz > now() + interval '2 hours';

  -- 40 ta demo lid: holat, manba va vaqt voronka va manbalar hisoboti to'liq ko'rinishi uchun tanlangan.
  for r in
    select * from (values
      ('Aziz Rahimov',          'new',            'instagram', 'english',    0.002, null, null,             null),
      ('Malika Tursunova',      'new',            'telegram',  'math',       0.006, null, null,             null),
      ('Sherzod Qodirov',       'new',            'instagram', 'it',         0.015, null, null,             null),
      ('Gulnora Ahmedova',      'new',            'google',    'english',    0.033, null, 'Samira',         11),
      ('Otabek Normatov',       'new',            'referral',  'abiturient', 0.083, null, null,             null),
      ('Nilufar Hasanova',      'contacted',      'instagram', 'english',    1.2,   null, 'Kamron',         9),
      ('Bekzod Ismoilov',       'contacted',      'instagram', 'it',         1.8,   null, null,             null),
      ('Dildora Yusupova',      'contacted',      'telegram',  'russian',    2.4,   null, 'Asal',           8),
      ('Jamshid Karimov',       'contacted',      'google',    'math',       3.1,   null, null,             null),
      ('Kamola Saidova',        'contacted',      'instagram', 'english',    4.0,   null, null,             null),
      ('Ulugʻbek Rasulov',      'contacted',      'direct',    'abiturient', 5.2,   null, null,             null),
      ('Feruza Aliyeva',        'contacted',      'telegram',  'it',         6.0,   null, 'Doniyor',        12),
      ('Sardor Mirzayev',       'trial_booked',   'instagram', 'english',    0.6,   null, null,             null),
      ('Madina Ergasheva',      'trial_booked',   'telegram',  'math',       1.1,   null, 'Mohinur',        13),
      ('Javlon Hamidov',        'trial_booked',   'instagram', 'it',         1.6,   null, null,             null),
      ('Zarina Umarova',        'trial_booked',   'referral',  'english',    2.2,   null, 'Iroda',          10),
      ('Rustam Sobirov',        'trial_booked',   'google',    'abiturient', 2.9,   null, null,             null),
      ('Shahnoza Nazarova',     'trial_booked',   'instagram', 'russian',    3.5,   null, 'Muhammadali',    7),
      ('Elyor Xolmatov',        'trial_booked',   'telegram',  'english',    4.4,   null, null,             null),
      ('Lola Azimova',          'trial_attended', 'instagram', 'english',    6.3,   null, null,             null),
      ('Temur Bakirov',         'trial_attended', 'referral',  'math',       7.5,   null, 'Ali',            14),
      ('Sabina Rahmonova',      'trial_attended', 'telegram',  'it',         9.0,   null, null,             null),
      ('Farrux Joʻrayev',       'trial_attended', 'instagram', 'english',    11.2,  null, null,             null),
      ('Nigora Qosimova',       'trial_attended', 'google',    'russian',    13.0,  null, 'Sevinch',        9),
      ('Akmal Tojiyev',         'trial_attended', 'instagram', 'abiturient', 14.8,  null, null,             null),
      ('Dilshod Valiyev',       'paid',           'referral',  'english',    8.4,   null, null,             null),
      ('Mohira Rashidova',      'paid',           'instagram', 'english',    10.1,  null, 'Amir',           12),
      ('Sanjar Olimov',         'paid',           'telegram',  'it',         12.6,  null, null,             null),
      ('Gulbahor Mamatova',     'paid',           'referral',  'math',       15.3,  null, 'Zuhra',          15),
      ('Islom Abdurahmonov',    'paid',           'instagram', 'english',    17.9,  null, null,             null),
      ('Yulduz Sharipova',      'paid',           'instagram', 'abiturient', 20.5,  null, null,             null),
      ('Behruz Komilov',        'paid',           'referral',  'it',         23.2,  null, null,             null),
      ('Ozoda Raximova',        'paid',           'telegram',  'russian',    26.7,  null, 'Diyor',          10),
      ('Anvar Shukurov',        'lost',           'instagram', 'english',    3.4,   'expensive', null,      null),
      ('Maftuna Qurbonova',     'lost',           'instagram', 'it',         6.8,   'schedule',  null,      null),
      ('Bobur Toirov',          'lost',           'telegram',  'math',       9.6,   'far',       null,      null),
      ('Saida Nurmatova',       'lost',           'google',    'english',    12.4,  'no_answer', null,      null),
      ('Erkin Davletov',        'lost',           'instagram', 'russian',    16.1,  'no_answer', null,      null),
      ('Hilola Yoʻldosheva',    'lost',           'direct',    'english',    19.7,  'other',     null,      null),
      ('Azamat Jumayev',        'lost',           'instagram', 'abiturient', 24.9,  'expensive', null,      null)
    ) as t(full_name, status, source, direction, days_ago, lost_reason, student_name, student_age)
  loop
    v_i := v_i + 1;
    v_created := now() - make_interval(secs => (r.days_ago * 86400)::double precision);
    v_contact := case when r.status = 'new' then null else v_created + make_interval(mins => 4 + (v_i * 7) % 36) end;
    select id into v_dir_id from public.directions where slug = r.direction;
    select id, price_monthly into v_course_id, v_price from public.courses
     where direction_id = v_dir_id and is_active order by is_featured desc, sort offset (v_i % 2) limit 1;
    if v_course_id is null then
      select id, price_monthly into v_course_id, v_price from public.courses where direction_id = v_dir_id order by sort limit 1;
    end if;

    insert into public.leads (full_name, phone, locale, channel, direction_id, course_id, status, lost_reason, source,
                              utm_source, utm_medium, utm_campaign, tg_username, created_at, first_contact_at,
                              group_notified_at, sla_alerted_at, paid_at, paid_amount)
    values (
      r.full_name,
      format('+998%s%s', v_codes[1 + v_i % 10], lpad(((v_i * 1379117) % 10000000)::text, 7, '0')),
      (case when v_i % 4 = 0 then 'ru' else 'uz' end)::public.locale,
      (case when r.source = 'telegram' then 'telegram' else 'web' end)::public.channel,
      v_dir_id, v_course_id, r.status::public.lead_status, r.lost_reason::public.lost_reason, r.source,
      case r.source when 'instagram' then 'instagram' when 'google' then 'google' when 'telegram' then 'tg' end,
      case r.source when 'instagram' then 'cpc' when 'google' then 'cpc' when 'telegram' then 'deeplink' end,
      case r.source when 'instagram' then (array['oct_ielts', 'oct_kids', 'oct_it'])[1 + v_i % 3] when 'google' then 'search_courses' when 'telegram' then 'ig_story' end,
      case when r.source = 'telegram' then 'user' || v_i end,
      v_created, v_contact,
      v_created,
      case when r.status = 'new' and r.days_ago * 1440 > 15 then v_created + interval '15 minutes' end,
      case when r.status = 'paid' then v_created + make_interval(days => 3 + v_i % 3) end,
      case when r.status = 'paid' then v_price end
    ) returning id into v_lead_id;

    update public.lead_events set created_at = v_created where lead_id = v_lead_id;
    if r.status <> 'new' then
      insert into public.lead_events (lead_id, type, from_status, to_status, created_at)
      values (v_lead_id, 'status_changed', 'new', r.status::public.lead_status, v_contact);
    end if;

    insert into public.students (lead_id, full_name, age, created_at)
    values (v_lead_id, coalesce(r.student_name, r.full_name), r.student_age, v_created)
    returning id into v_student_id;

    -- Daraja testi: til va matematika lidlarining yarmi testdan kelgan.
    if r.direction in ('english', 'russian', 'math') and v_i % 2 = 1 then
      insert into public.test_attempts (direction_id, lead_id, session_id, question_ids, score, max_score, result_level,
                                        recommended_course_id, channel, finished_at, created_at)
      values (v_dir_id, v_lead_id, 'demo-' || v_i, '{}', 6 + v_i % 6, 12, 1 + v_i % 4, v_course_id, 'web', v_created, v_created)
      returning id into v_attempt_id;
      update public.leads set test_attempt_id = v_attempt_id where id = v_lead_id;
    end if;

    v_branch := v_branches[1 + v_i % array_length(v_branches, 1)];

    if r.status = 'trial_booked' then
      select id into v_slot_id from public.trial_slots
       where direction_id = v_dir_id and branch_id = v_branch and booked_count < capacity
         and starts_at >= ((v_today + 1 + v_i % 4)::timestamp + time '15:00') at time zone v_tz
       order by starts_at limit 1;
      if v_slot_id is not null then
        update public.trial_slots set booked_count = booked_count + 1 where id = v_slot_id;
        insert into public.bookings (lead_id, student_id, slot_id, status, created_at)
        values (v_lead_id, v_student_id, v_slot_id, 'booked', v_created);
      end if;
    elsif r.status in ('trial_attended', 'paid') or (r.status = 'contacted' and v_i % 3 = 0) then
      v_slot_at := ((v_created at time zone v_tz)::date + 2)::timestamp + time '18:00';
      v_slot_at := v_slot_at at time zone v_tz;
      insert into public.trial_slots (branch_id, direction_id, starts_at, duration_min, capacity, booked_count)
      values (v_branch, v_dir_id, v_slot_at, 60, 6, 1)
      on conflict (branch_id, direction_id, starts_at) do update set booked_count = public.trial_slots.booked_count + 1
      returning id into v_slot_id;
      insert into public.bookings (lead_id, student_id, slot_id, status, feedback_score, followup_sent_at, created_at)
      values (v_lead_id, v_student_id, v_slot_id,
              (case when r.status = 'contacted' then 'no_show' else 'attended' end)::public.booking_status,
              case when r.status <> 'contacted' then 3 + v_i % 3 end,
              case when r.status <> 'contacted' then v_slot_at + interval '2 hours' end,
              v_created);
    end if;

    -- Bitta telefon — ikki farzand (v1.1, 6-qaror): Zarina opaning ikkinchi farzandi ham yozilgan.
    if r.full_name = 'Zarina Umarova' then
      insert into public.students (lead_id, full_name, age, created_at)
      values (v_lead_id, 'Ibrohim', 8, v_created) returning id into v_student_id;
      select id into v_slot_id from public.trial_slots
       where direction_id = v_dir_id and branch_id = v_branch and booked_count < capacity
         and starts_at >= ((v_today + 2)::timestamp + time '10:00') at time zone v_tz
       order by starts_at limit 1;
      if v_slot_id is not null then
        update public.trial_slots set booked_count = booked_count + 1 where id = v_slot_id;
        insert into public.bookings (lead_id, student_id, slot_id, status, created_at)
        values (v_lead_id, v_student_id, v_slot_id, 'booked', v_created);
      end if;
    end if;
  end loop;

  -- Reklama xarajati: oxirgi 4 hafta (dushanba). Google'ning to'lovchisi yo'q, referral — bepul: panel buni ko'rsatadi.
  insert into public.ad_spend (source, week_start, amount)
  select s.source, (date_trunc('week', v_today)::date - 7 * w.k), s.amounts[w.k + 1]
    from (values
      ('instagram', array[1700000, 1500000, 1600000, 1400000]),
      ('telegram',  array[600000, 600000, 500000, 600000]),
      ('google',    array[400000, 400000, 400000, 400000])
    ) as s(source, amounts)
    cross join generate_series(0, 3) as w(k);

  return jsonb_build_object(
    'groups', (select count(*) from public.groups),
    'trial_slots', (select count(*) from public.trial_slots),
    'leads', (select count(*) from public.leads),
    'students', (select count(*) from public.students),
    'bookings', (select count(*) from public.bookings),
    'ad_spend', (select count(*) from public.ad_spend)
  );
end $$;

revoke execute on function public.reset_demo_data() from public, anon, authenticated;
