#!/usr/bin/env python3
# Usage: python3 scripts/gen_seed.py > supabase/seed.sql
"""Generates supabase/seed.sql (static content). Uzbek text: o'/g' -> U+02BB, other ' -> U+02BC."""
import json, re, sys

def uz(s: str) -> str:
    s = re.sub(r"([oOgG])'", lambda m: m.group(1) + "ʻ", s)
    return s.replace("'", "ʼ")

def q(s):
    if s is None:
        return "null"
    return "'" + str(s).replace("'", "''") + "'"

def arr(items):
    return "array[" + ", ".join(q(i) for i in items) + "]::text[]" if items else "'{}'::text[]"

def js(obj):
    return q(json.dumps(obj, ensure_ascii=False)) + "::jsonb"

def tri(u, r, e):
    return {"uz": uz(u), "ru": r, "en": e}

def same(t):
    return {"uz": t, "ru": t, "en": t}

out = []
w = out.append
w("-- Zukkolab demo kontenti (statik). Dinamik qism (guruhlar, slotlar, lidlar) — select public.reset_demo_data().")
w("-- Barcha maʼlumotlar toʻqima. Qayta ishga tushirish xavfsiz: kontent jadvallari tozalanib qayta toʻldiriladi.\n")
w("begin;\n")
w("delete from public.bookings; delete from public.students; delete from public.lead_events; delete from public.leads;")
w("delete from public.test_attempts; delete from public.trial_slots; delete from public.groups;")
w("delete from public.test_questions; delete from public.testimonials; delete from public.faq;")
w("delete from public.teachers; delete from public.courses; delete from public.branches; delete from public.directions;\n")

# ── Directions
directions = [
    ("english", "Ingliz tili", "Английский язык", "English", "languages", "#6D4AFF", True, 1),
    ("russian", "Rus tili", "Русский язык", "Russian", "book-open", "#FF6B57", True, 2),
    ("math", "Matematika", "Математика", "Mathematics", "sigma", "#14121F", True, 3),
    ("it", "IT va dasturlash", "IT и программирование", "IT and coding", "code", "#2F9E6B", True, 4),
    ("abiturient", "Abituriyentlar", "Абитуриенты", "University prep", "graduation-cap", "#E2A400", True, 5),
]
w("insert into public.directions (slug, name_uz, name_ru, name_en, icon, color, has_test, sort) values")
w(",\n".join(f"  ({q(s)}, {q(uz(a))}, {q(b)}, {q(c)}, {q(i)}, {q(col)}, {str(t).lower()}, {o})" for s, a, b, c, i, col, t, o in directions) + ";\n")

# ── Branches
branches = [
    ("chilonzor", ("Chilonzor", "Чиланзар", "Chilanzar"),
     ("Chilonzor tumani, Bunyodkor shoh ko'chasi, 12-uy", "Чиланзарский район, проспект Бунёдкор, 12", "12 Bunyodkor Avenue, Chilanzar district"),
     ("Novza metro bekati yonida", "Рядом со станцией метро Новза", "Next to Novza metro station"),
     41.2826, 69.2125, "+998712001010", 1),
    ("yunusobod", ("Yunusobod", "Юнусабад", "Yunusabad"),
     ("Yunusobod tumani, Amir Temur shoh ko'chasi, 108-uy", "Юнусабадский район, проспект Амира Темура, 108", "108 Amir Temur Avenue, Yunusabad district"),
     ("Yunusobod metro bekati, 3-chiqish", "Станция метро Юнусабад, выход 3", "Yunusabad metro station, exit 3"),
     41.3647, 69.2870, "+998712002020", 2),
    ("mirzo-ulugbek", ("Mirzo Ulug'bek", "Мирзо-Улугбек", "Mirzo Ulugbek"),
     ("Mirzo Ulug'bek tumani, Buyuk Ipak Yo'li ko'chasi, 45-uy", "Мирзо-Улугбекский район, улица Буюк Ипак Йули, 45", "45 Buyuk Ipak Yuli Street, Mirzo Ulugbek district"),
     ("Buyuk Ipak Yo'li metro bekati qarshisida", "Напротив станции метро Буюк Ипак Йули", "Opposite Buyuk Ipak Yuli metro station"),
     41.3260, 69.3270, "+998712003030", 3),
]
hours = ("Du–Sh: 09:00–20:00, Ya: dam olish", "Пн–Сб: 09:00–20:00, Вс: выходной", "Mon–Sat: 9:00–20:00, Sun: closed")
w("insert into public.branches (slug, name_uz, name_ru, name_en, address_uz, address_ru, address_en, landmark_uz, landmark_ru, landmark_en, lat, lng, phone, working_hours_uz, working_hours_ru, working_hours_en, photo_url, sort) values")
w(",\n".join(
    f"  ({q(s)}, {q(uz(n[0]))}, {q(n[1])}, {q(n[2])}, {q(uz(a[0]))}, {q(a[1])}, {q(a[2])}, {q(uz(l[0]))}, {q(l[1])}, {q(l[2])}, {lat}, {lng}, {q(ph)}, {q(uz(hours[0]))}, {q(hours[1])}, {q(hours[2])}, {q('/images/branches/' + s + '.webp')}, {o})"
    for s, n, a, l, lat, lng, ph, o in branches) + ";\n")

# ── Courses: slug, dir, titles, descriptions, program(uz,ru,en lists), lvl_from, lvl_to, age, months, per_week, minutes, price, featured, sort
courses = [
    ("english-kids", "english", ("Bolalar uchun ingliz tili", "Английский для детей", "English for Kids"),
     ("7–11 yoshli bolalar uchun o'yin, qo'shiq va multfilmlar orqali ingliz tili. Har darsda gapirish amaliyoti.",
      "Английский для детей 7–11 лет через игры, песни и мультфильмы. Разговорная практика на каждом уроке.",
      "English for children aged 7–11 through games, songs and cartoons. Speaking practice in every lesson."),
     (["Alifbo va talaffuz", "Kundalik so'zlar: oila, maktab, hayvonlar", "Oddiy jumlalar tuzish", "Qo'shiq va rolli o'yinlar"],
      ["Алфавит и произношение", "Повседневные слова: семья, школа, животные", "Простые предложения", "Песни и ролевые игры"],
      ["Alphabet and pronunciation", "Everyday words: family, school, animals", "Building simple sentences", "Songs and role plays"]),
     1, 2, "kids", 9, 3, 60, 600000, False, 1),
    ("general-english", "english", ("General English", "General English", "General English"),
     ("Boshlang'ichdan B2 gacha: grammatika, lug'at va erkin muloqot. Har 2 oyda daraja nazorati.",
      "С нуля до B2: грамматика, лексика и свободное общение. Контроль уровня каждые 2 месяца.",
      "From beginner to B2: grammar, vocabulary and fluent conversation. Level check every 2 months."),
     (["Grammatika asoslari", "So'z boyligi: 1500+ so'z", "Speaking club har hafta", "Daraja imtihoni"],
      ["Основы грамматики", "Словарный запас: 1500+ слов", "Speaking club каждую неделю", "Экзамен на уровень"],
      ["Grammar foundations", "Vocabulary: 1,500+ words", "Weekly speaking club", "Level exam"]),
     1, 3, "teens", 6, 3, 90, 750000, True, 2),
    ("ielts-intensive", "english", ("IELTS Intensive", "IELTS Intensive", "IELTS Intensive"),
     ("B1 dan boshlab IELTS 7.0+ ga tayyorlov: 4 ta ko'nikma, haftalik mock test va individual feedback.",
      "Подготовка к IELTS 7.0+ с уровня B1: 4 навыка, еженедельный mock-тест и индивидуальный разбор.",
      "IELTS 7.0+ preparation from B1: all 4 skills, weekly mock test and individual feedback."),
     (["Listening va Reading strategiyalari", "Writing Task 1 va 2", "Speaking: Part 1–3", "Har hafta mock test"],
      ["Стратегии Listening и Reading", "Writing Task 1 и 2", "Speaking: Part 1–3", "Mock-тест каждую неделю"],
      ["Listening and Reading strategies", "Writing Task 1 and 2", "Speaking: Parts 1–3", "Weekly mock test"]),
     2, 4, "teens", 4, 5, 90, 1100000, True, 3),
    ("russian-kids", "russian", ("Bolalar uchun rus tili", "Русский для детей", "Russian for Kids"),
     ("Maktabga tayyorgarlik va 1–4-sinf o'quvchilari uchun rus tili: o'qish, yozish va so'zlashuv.",
      "Русский язык для дошкольников и учеников 1–4 классов: чтение, письмо и разговор.",
      "Russian for preschoolers and grades 1–4: reading, writing and speaking."),
     (["Alifbo va o'qish", "Yozuv va imlo", "So'zlashuv mavzulari", "Ertak va she'rlar"],
      ["Алфавит и чтение", "Письмо и орфография", "Разговорные темы", "Сказки и стихи"],
      ["Alphabet and reading", "Writing and spelling", "Conversation topics", "Fairy tales and poems"]),
     1, 2, "kids", 9, 3, 60, 550000, False, 4),
    ("russian-general", "russian", ("Rus tili: so'zlashuv va grammatika", "Русский язык: разговор и грамматика", "Russian: Speaking and Grammar"),
     ("O'smirlar va kattalar uchun: kelishiklar, fe'llar va erkin muloqot. Ish va o'qish uchun rus tili.",
      "Для подростков и взрослых: падежи, глаголы и свободное общение. Русский для учёбы и работы.",
      "For teens and adults: cases, verbs and fluent conversation. Russian for study and work."),
     (["Kelishiklar tizimi", "Fe'l turlari va zamonlar", "Ish suhbati va hujjatlar", "Erkin muloqot klubi"],
      ["Система падежей", "Виды глагола и времена", "Деловое общение и документы", "Разговорный клуб"],
      ["The case system", "Verb aspects and tenses", "Business talk and documents", "Conversation club"]),
     1, 4, "adults", 6, 3, 90, 650000, False, 5),
    ("math-school", "math", ("Maktab matematikasi", "Школьная математика", "School Math"),
     ("5–9-sinflar uchun: mavzularni tushunib o'rganish, baholarni oshirish va nazorat ishlariga tayyorgarlik.",
      "Для 5–9 классов: понимание тем, рост оценок и подготовка к контрольным.",
      "For grades 5–9: understanding topics, better grades and test preparation."),
     (["Kasrlar va foizlar", "Tenglamalar", "Geometriya asoslari", "Nazorat ishiga tayyorgarlik"],
      ["Дроби и проценты", "Уравнения", "Основы геометрии", "Подготовка к контрольным"],
      ["Fractions and percentages", "Equations", "Geometry basics", "Test preparation"]),
     1, 3, "teens", 9, 3, 90, 600000, False, 6),
    ("math-olympiad", "math", ("Olimpiada matematikasi", "Олимпиадная математика", "Olympiad Math"),
     ("Kuchli o'quvchilar uchun: nostandart masalalar, kombinatorika va sonlar nazariyasi. Tuman va shahar olimpiadalariga tayyorlov.",
      "Для сильных учеников: нестандартные задачи, комбинаторика и теория чисел. Подготовка к районным и городским олимпиадам.",
      "For strong students: non-standard problems, combinatorics and number theory. Preparation for district and city olympiads."),
     (["Sonlar nazariyasi", "Kombinatorika", "Olimpiada geometriyasi", "Har oy sinov olimpiadasi"],
      ["Теория чисел", "Комбинаторика", "Олимпиадная геометрия", "Пробная олимпиада каждый месяц"],
      ["Number theory", "Combinatorics", "Olympiad geometry", "Monthly mock olympiad"]),
     3, 4, "teens", 9, 2, 120, 800000, True, 7),
    ("abiturient-dtm", "abiturient", ("Abituriyent: DTM tayyorlov", "Абитуриент: подготовка к DTM", "University Entrance Prep"),
     ("Oliy o'quv yurtiga kirish testlariga tayyorlov: matematika va asosiy fan, haftalik DTM formatidagi sinov testlari.",
      "Подготовка к вступительным тестам в вуз: математика и профильный предмет, еженедельные пробные тесты в формате DTM.",
      "Preparation for university entrance tests: math and a core subject, weekly mock tests in DTM format."),
     (["Matematika: barcha mavzular", "Asosiy fan bo'yicha chuqur tayyorlov", "Haftalik DTM sinov testi", "Vaqtni boshqarish strategiyasi"],
      ["Математика: все темы", "Углублённая подготовка по профильному предмету", "Еженедельный пробный тест DTM", "Стратегия управления временем"],
      ["Math: all topics", "In-depth core subject preparation", "Weekly DTM mock test", "Time management strategy"]),
     1, 4, "teens", 8, 5, 120, 900000, True, 8),
    ("python-kids", "it", ("Bolalar uchun Python", "Python для детей", "Python for Kids"),
     ("9–13 yoshli bolalar uchun: o'yinlar yaratish orqali dasturlash mantiqini o'rganish.",
      "Для детей 9–13 лет: изучаем логику программирования, создавая игры.",
      "For kids aged 9–13: learning programming logic by building games."),
     (["Scratch'dan Python'ga", "O'zgaruvchilar va sikllar", "Birinchi o'yin", "Yakuniy loyiha taqdimoti"],
      ["От Scratch к Python", "Переменные и циклы", "Первая игра", "Защита итогового проекта"],
      ["From Scratch to Python", "Variables and loops", "Your first game", "Final project demo"]),
     1, 4, "kids", 6, 2, 90, 700000, False, 9),
    ("frontend", "it", ("Frontend dasturlash", "Frontend-разработка", "Frontend Development"),
     ("HTML, CSS, JavaScript va React: noldan portfolio bilan ishga tayyor darajagacha.",
      "HTML, CSS, JavaScript и React: с нуля до готового к работе уровня с портфолио.",
      "HTML, CSS, JavaScript and React: from zero to job-ready with a portfolio."),
     (["HTML va CSS", "JavaScript asoslari", "React", "Portfolio uchun 3 ta loyiha"],
      ["HTML и CSS", "Основы JavaScript", "React", "3 проекта для портфолио"],
      ["HTML and CSS", "JavaScript basics", "React", "3 portfolio projects"]),
     1, 4, "adults", 8, 3, 120, 1200000, True, 10),
    ("backend-python", "it", ("Backend: Python va Django", "Backend: Python и Django", "Backend: Python and Django"),
     ("Server dasturlash: Python, ma'lumotlar bazasi, API va deploy. Real loyiha jamoada.",
      "Серверная разработка: Python, базы данных, API и деплой. Реальный проект в команде.",
      "Server-side development: Python, databases, APIs and deployment. A real team project."),
     (["Python asoslari", "SQL va PostgreSQL", "Django va REST API", "Jamoaviy loyiha"],
      ["Основы Python", "SQL и PostgreSQL", "Django и REST API", "Командный проект"],
      ["Python basics", "SQL and PostgreSQL", "Django and REST APIs", "Team project"]),
     1, 4, "adults", 8, 3, 120, 1200000, False, 11),
    ("ui-ux-design", "it", ("UI/UX dizayn", "UI/UX-дизайн", "UI/UX Design"),
     ("Figma'da ilova va saytlar dizayni: foydalanuvchi tadqiqoti, prototip va portfolio.",
      "Дизайн приложений и сайтов в Figma: исследование пользователей, прототип и портфолио.",
      "App and web design in Figma: user research, prototyping and a portfolio."),
     (["Dizayn asoslari va kompozitsiya", "Figma", "UX tadqiqot va prototip", "Portfolio keys"],
      ["Основы дизайна и композиция", "Figma", "UX-исследование и прототип", "Кейс для портфолио"],
      ["Design basics and composition", "Figma", "UX research and prototyping", "Portfolio case study"]),
     1, 4, "adults", 5, 3, 120, 1000000, False, 12),
]
w("insert into public.courses (direction_id, slug, title_uz, title_ru, title_en, description_uz, description_ru, description_en, program_uz, program_ru, program_en, level_from, level_to, age_group, duration_months, lessons_per_week, lesson_minutes, price_monthly, is_featured, sort) values")
rows = []
for slug, d, t, desc, prog, lf, lt, age, mo, pw, mi, price, feat, srt in courses:
    rows.append(f"  ((select id from public.directions where slug = {q(d)}), {q(slug)}, {q(uz(t[0]))}, {q(t[1])}, {q(t[2])}, {q(uz(desc[0]))}, {q(desc[1])}, {q(desc[2])}, "
                f"{arr([uz(x) for x in prog[0]])}, {arr(prog[1])}, {arr(prog[2])}, {lf}, {lt}, {q(age)}, {mo}, {pw}, {mi}, {price}, {str(feat).lower()}, {srt})")
w(",\n".join(rows) + ";\n")

# ── Teachers
teachers = [
    ("Dilnoza Karimova", "english", 7, ["IELTS 8.5", "CELTA"],
     ("IELTS bo'yicha 300 dan ortiq o'quvchini 7.0+ natijaga olib chiqqan. Darslarida ko'proq gapirtiradi.",
      "Подготовила более 300 учеников к IELTS 7.0+. На уроках больше всего говорят ученики.",
      "Has taken 300+ students to IELTS 7.0+. In her lessons, students do most of the talking.")),
    ("Jasur Toshmatov", "english", 5, ["IELTS 8.0", "TKT"],
     ("Bolalar va o'smirlar bilan ishlaydi. O'yin va loyihalar orqali o'qitadi.",
      "Работает с детьми и подростками. Учит через игры и проекты.",
      "Works with kids and teens. Teaches through games and projects.")),
    ("Svetlana Kim", "russian", 12, ["Rus filologiyasi magistri"],
     ("12 yillik tajriba. Grammatikani jadval va misollar bilan oson tushuntiradi.",
      "12 лет опыта. Объясняет грамматику просто — через схемы и примеры.",
      "12 years of experience. Makes grammar simple with charts and examples.")),
    ("Bekzod Yusupov", "math", 9, ["Respublika olimpiadasi g'olibi", "Olimpiada murabbiyi"],
     ("O'quvchilari shahar olimpiadalarida 40 dan ortiq sovrin olgan.",
      "Его ученики взяли более 40 призов на городских олимпиадах.",
      "His students have won 40+ prizes at city olympiads.")),
    ("Malika Ergasheva", "abiturient", 8, ["DTM 189 ball", "Pedagogika magistri"],
     ("Abituriyentlarni DTM formatida tayyorlaydi; har hafta sinov testi va tahlil.",
      "Готовит абитуриентов в формате DTM: еженедельный пробный тест и разбор.",
      "Prepares applicants in DTM format: a weekly mock test with review.")),
    ("Sardor Aliyev", "it", 6, ["Senior Frontend Developer", "React"],
     ("Mahalliy IT kompaniyada senior frontend dasturchi. Darsda real loyihalar ustida ishlaydi.",
      "Senior frontend-разработчик в местной IT-компании. На уроках — реальные проекты.",
      "Senior frontend developer at a local IT company. Lessons are built around real projects.")),
    ("Nodira Saidova", "it", 5, ["Product Designer", "Google UX Certificate"],
     ("Mahsulot dizayneri. 20 dan ortiq ilova va sayt dizaynini yaratgan.",
      "Продуктовый дизайнер. Создала дизайн более 20 приложений и сайтов.",
      "Product designer. Has designed 20+ apps and websites.")),
    ("Timur Abdullayev", "it", 7, ["Python Developer", "Django"],
     ("Backend dasturchi va bolalar uchun Python o'qituvchisi. Murakkabni oddiy tilda tushuntiradi.",
      "Backend-разработчик и преподаватель Python для детей. Объясняет сложное простым языком.",
      "Backend developer and Python teacher for kids. Explains complex things in plain words.")),
]
w("insert into public.teachers (full_name, photo_url, direction_id, experience_years, certificates, bio_uz, bio_ru, bio_en, sort) values")
w(",\n".join(
    f"  ({q(n)}, {q('/images/teachers/' + n.split()[0].lower() + '.webp')}, (select id from public.directions where slug = {q(d)}), {y}, {arr([uz(c) for c in certs])}, {q(uz(b[0]))}, {q(b[1])}, {q(b[2])}, {i + 1})"
    for i, (n, d, y, certs, b) in enumerate(teachers)) + ";\n")

# ── FAQ
faq = [
    ("Sinov darsi haqiqatan bepulmi?", "Пробный урок действительно бесплатный?", "Is the trial lesson really free?",
     "Ha, birinchi sinov darsi to'liq bepul va hech qanday majburiyat yo'q. Darsdan keyin o'zingiz qaror qilasiz.",
     "Да, первый пробный урок полностью бесплатный и ни к чему не обязывает. После урока вы решаете сами.",
     "Yes, the first trial lesson is completely free with no obligation. You decide after the lesson."),
    ("Narxlar qancha?", "Сколько стоит обучение?", "How much do courses cost?",
     "Kurslar oyiga 550 000 so'mdan 1 200 000 so'mgacha. Aniq narx kurs sahifasida ko'rsatilgan.",
     "Курсы стоят от 550 000 до 1 200 000 сумов в месяц. Точная цена указана на странице курса.",
     "Courses cost from 550,000 to 1,200,000 UZS per month. The exact price is on each course page."),
    ("Bo'lib to'lash mumkinmi?", "Можно ли платить частями?", "Can I pay in instalments?",
     "Ha, to'lov har oy amalga oshiriladi. 3 oy uchun oldindan to'lasangiz — 10% chegirma.",
     "Да, оплата помесячная. При оплате за 3 месяца вперёд — скидка 10%.",
     "Yes, payment is monthly. Pay for 3 months upfront and get 10% off."),
    ("Chegirmalar bormi?", "Есть ли скидки?", "Are there any discounts?",
     "Aka-uka va opa-singillar uchun ikkinchi farzandga 15% chegirma. Do'stini olib kelgan o'quvchiga 1 hafta bepul.",
     "Для братьев и сестёр — скидка 15% на второго ребёнка. Привёл друга — неделя обучения бесплатно.",
     "Siblings get 15% off for the second child. Bring a friend and get one week free."),
    ("Guruhda nechta o'quvchi bo'ladi?", "Сколько учеников в группе?", "How many students are in a group?",
     "Guruhlarda 8 tadan 12 tagacha o'quvchi. Bolalar guruhlarida — 10 tagacha.",
     "В группах от 8 до 12 учеников. В детских группах — до 10.",
     "Groups have 8 to 12 students. Kids' groups have up to 10."),
    ("Agar natija bo'lmasa-chi?", "А если не будет результата?", "What if I don't see results?",
     "Birinchi oy oxirida o'quvchi darajasi tekshiriladi. Natija bo'lmasa, keyingi oy bepul.",
     "В конце первого месяца проверяем уровень. Если результата нет — следующий месяц бесплатно.",
     "We check the student's level at the end of the first month. No progress means the next month is free."),
    ("Darslar qaysi tilda o'tadi?", "На каком языке проходят занятия?", "What language are classes taught in?",
     "Tushuntirishlar o'zbek yoki rus tilida — guruh tanlovingizga qarab. Til kurslarida asosiy amaliyot o'qitilayotgan tilda.",
     "Объяснения на узбекском или русском — по выбору группы. На языковых курсах основная практика — на изучаемом языке.",
     "Explanations are in Uzbek or Russian depending on the group. Language courses practise mostly in the target language."),
    ("Darsni o'tkazib yuborsam nima bo'ladi?", "Что если я пропущу урок?", "What if I miss a class?",
     "Har bir dars yozib olinadi va Telegram guruhga yuboriladi. O'qituvchi bilan qo'shimcha konsultatsiya ham bor.",
     "Каждый урок записывается и отправляется в Telegram-группу. Есть дополнительные консультации с преподавателем.",
     "Every lesson is recorded and shared in the Telegram group. Extra consultations with the teacher are available."),
    ("Qaysi filial menga yaqin?", "Какой филиал ближе ко мне?", "Which branch is closest to me?",
     "Bizda 3 ta filial bor: Chilonzor (Novza metro), Yunusobod (Yunusobod metro) va Mirzo Ulug'bek (Buyuk Ipak Yo'li metro).",
     "У нас 3 филиала: Чиланзар (метро Новза), Юнусабад (метро Юнусабад) и Мирзо-Улугбек (метро Буюк Ипак Йули).",
     "We have 3 branches: Chilanzar (Novza metro), Yunusabad (Yunusabad metro) and Mirzo Ulugbek (Buyuk Ipak Yuli metro)."),
    ("Necha yoshdan qabul qilasiz?", "С какого возраста принимаете?", "From what age do you accept students?",
     "7 yoshdan boshlab. 7–11 yoshli bolalar uchun alohida o'yin uslubidagi kurslar bor.",
     "С 7 лет. Для детей 7–11 лет есть отдельные курсы в игровом формате.",
     "From age 7. Children aged 7–11 have separate game-based courses."),
]
w("insert into public.faq (question_uz, question_ru, question_en, answer_uz, answer_ru, answer_en, sort) values")
w(",\n".join(f"  ({q(uz(a))}, {q(b)}, {q(c)}, {q(uz(d))}, {q(e)}, {q(f)}, {i + 1})" for i, (a, b, c, d, e, f) in enumerate(faq)) + ";\n")

# ── Testimonials (demo)
testimonials = [
    ("Aziz, 17", "english", ("IELTS 7.5", "IELTS 7.5", "IELTS 7.5"),
     ("4 oyda 5.5 dan 7.5 ga chiqdim. Har hafta mock test eng ko'p yordam berdi.",
      "За 4 месяца поднялся с 5.5 до 7.5. Больше всего помогли еженедельные mock-тесты.",
      "I went from 5.5 to 7.5 in 4 months. The weekly mock tests helped the most.")),
    ("Madina, 15", "math", ("Shahar olimpiadasi, 2-o'rin", "Городская олимпиада, 2 место", "City olympiad, 2nd place"),
     ("Oldin olimpiada masalalaridan qo'rqardim, endi ularni yechish eng qiziq mashg'ulotim.",
      "Раньше боялась олимпиадных задач, теперь это моё любимое занятие.",
      "I used to be afraid of olympiad problems — now solving them is my favourite thing.")),
    ("Sevara opa (ota-ona)", "russian", ("O'g'li 3 oyda erkin gapira boshladi", "Сын за 3 месяца заговорил свободно", "Her son speaks freely after 3 months"),
     ("O'g'lim maktabda rus tilidan qiynalardi. 3 oyda baholari 5 ga chiqdi, endi o'zi kitob o'qiydi.",
      "Сыну было тяжело с русским в школе. За 3 месяца оценки выросли до пятёрок, теперь он сам читает книги.",
      "My son struggled with Russian at school. In 3 months his grades went up to top marks and now he reads books himself.")),
    ("Javohir, 22", "it", ("Junior Frontend dasturchi", "Junior Frontend-разработчик", "Junior Frontend Developer"),
     ("Kurs tugashidan oldin portfoliodagi loyiham bilan ishga qabul qilindim.",
      "Меня взяли на работу ещё до окончания курса — благодаря проекту из портфолио.",
      "I got hired before the course ended thanks to my portfolio project.")),
    ("Shahzoda, 18", "abiturient", ("DTM: 184 ball, grant", "DTM: 184 балла, грант", "DTM: 184 points, scholarship"),
     ("Haftalik sinov testlari imtihonda hayajonni yo'qotdi. Grant asosida o'qishga kirdim.",
      "Еженедельные пробные тесты сняли волнение на экзамене. Поступила на грант.",
      "Weekly mock tests took away my exam nerves. I got into university on a scholarship.")),
    ("Bobur, 10", "it", ("Birinchi o'yinini yaratdi", "Создал свою первую игру", "Built his first game"),
     ("Python'da o'zim o'yin yasadim va uni do'stlarimga ko'rsatdim!",
      "Я сам сделал игру на Python и показал её друзьям!",
      "I made my own game in Python and showed it to my friends!")),
]
w("insert into public.testimonials (name, direction_id, achievement_uz, achievement_ru, achievement_en, text_uz, text_ru, text_en, photo_url, is_demo, sort) values")
w(",\n".join(
    f"  ({q(uz(n))}, (select id from public.directions where slug = {q(d)}), {q(uz(a[0]))}, {q(a[1])}, {q(a[2])}, {q(uz(t[0]))}, {q(t[1])}, {q(t[2])}, {q('/images/testimonials/' + str(i + 1) + '.webp')}, true, {i + 1})"
    for i, (n, d, a, t) in enumerate(testimonials)) + ";\n")

# ── Test questions
def opts_same(pairs):
    return [{"key": k, "text": same(t)} for k, t in pairs]

def opts_tri(pairs):
    return [{"key": k, "text": tri(*t) if isinstance(t, tuple) else same(t)} for k, t in pairs]

K = ["a", "b", "c", "d"]

english = {
    1: [("She ___ a student.", ["am", "is", "are", "be"], "b"),
        ("I ___ to school every day.", ["goes", "going", "go", "gone"], "c"),
        ("There ___ two apples on the table.", ["is", "are", "am", "be"], "b"),
        ("What is the opposite of “hot”?", ["cold", "warm", "big", "fast"], "a"),
        ("___ you like coffee?", ["Does", "Is", "Do", "Are"], "c")],
    2: [("If it rains tomorrow, we ___ at home.", ["stay", "will stay", "stayed", "would stayed"], "b"),
        ("I have lived here ___ 2019.", ["for", "since", "from", "at"], "b"),
        ("She asked me where ___.", ["did I live", "I lived", "do I live", "I do live"], "b"),
        ("This is the ___ film I have ever seen.", ["more interesting", "most interesting", "interestinger", "much interesting"], "b"),
        ("I'm looking forward ___ you.", ["to see", "see", "to seeing", "seeing"], "c")],
    3: [("By the time we arrived, the film ___.", ["already started", "has already started", "had already started", "was already start"], "c"),
        ("I wish I ___ more time to study.", ["have", "had", "will have", "am having"], "b"),
        ("The report ___ by the manager yesterday.", ["was approved", "approved", "has approved", "was approving"], "a"),
        ("He denied ___ the window.", ["to break", "breaking", "break", "broke"], "b"),
        ("Choose the closest meaning to “reluctant”.", ["eager", "unwilling", "careful", "tired"], "b")],
    4: [("Hardly ___ the meeting started when the fire alarm went off.", ["had", "has", "did", "was"], "a"),
        ("Not until later ___ how serious the problem was.", ["we realised", "did we realise", "we did realise", "realised we"], "b"),
        ("Had I known about the traffic, I ___ earlier.", ["would leave", "would have left", "will leave", "left"], "b"),
        ("The proposal was rejected on the ___ that it was too expensive.", ["grounds", "reasons", "basis", "causes"], "a"),
        ("Choose the word closest to “meticulous”.", ["careless", "thorough", "quick", "generous"], "b")],
}
russian = {
    1: [("Как ___ зовут?", ["тебя", "ты", "тебе", "твой"], "a"),
        ("Я ___ в Ташкенте.", ["живёт", "живу", "живут", "жить"], "b"),
        ("Это ___ книга.", ["мой", "моё", "моя", "мои"], "c"),
        ("У меня есть ___.", ["сестра", "сестру", "сестре", "сестрой"], "a"),
        ("Мы ___ в школу утром.", ["иду", "идёшь", "идём", "идут"], "c")],
    2: [("Я давно не видел ___ брата.", ["мой", "моего", "моему", "моим"], "b"),
        ("Завтра я ___ домашнее задание.", ["делал", "сделаю", "сделал", "делала"], "b"),
        ("Она интересуется ___.", ["музыка", "музыку", "музыкой", "музыке"], "c"),
        ("Мы говорили ___ новом фильме.", ["о", "об", "в", "на"], "a"),
        ("Если будет хорошая погода, мы ___ в парк.", ["пошли бы", "пойдём", "шли", "пойти"], "b")],
    3: [("Книга, ___ я прочитал, очень интересная.", ["который", "которая", "которую", "которой"], "c"),
        ("Он пришёл, ___ урок уже закончился.", ["чтобы", "когда", "если", "хотя"], "b"),
        ("Нам нужно ___ к экзамену.", ["подготовиться", "подготовится", "подготовимся", "подготовка"], "a"),
        ("Подберите синоним к слову «быстро».", ["медленно", "стремительно", "спокойно", "тихо"], "b"),
        ("Я хочу, чтобы ты ___ мне завтра.", ["позвонишь", "позвонил", "звонишь", "позвонить"], "b")],
    4: [("Несмотря ___ дождь, мы пошли гулять.", ["на", "в", "о", "за"], "a"),
        ("Выберите правильно написанное слово.", ["расчёт", "рассчёт", "росчёт", "расщёт"], "a"),
        ("Ему было не ___ смеха.", ["к", "до", "для", "от"], "b"),
        ("Выражение «бить баклуши» означает:", ["много работать", "бездельничать", "драться", "готовить еду"], "b"),
        ("Какое слово пишется с НЕ слитно?", ["(не)был", "(не)навидеть", "(не)могу", "(не)знал"], "b")],
}
AND = ("va", "и", "and")
math = {
    1: [(("15 + 27 = ?", "15 + 27 = ?", "15 + 27 = ?"), ["32", "42", "43", "52"], "b"),
        (("8 × 7 = ?", "8 × 7 = ?", "8 × 7 = ?"), ["54", "56", "63", "48"], "b"),
        (("100 − 37 = ?", "100 − 37 = ?", "100 − 37 = ?"), ["63", "73", "67", "53"], "a"),
        (("1/2 + 1/4 = ?", "1/2 + 1/4 = ?", "1/2 + 1/4 = ?"), ["2/6", "3/4", "1/3", "2/4"], "b"),
        (("36 ni 4 ga bo'ling.", "Разделите 36 на 4.", "Divide 36 by 4."), ["8", "9", "6", "12"], "b")],
    2: [(("Tenglamani yeching: 3x + 5 = 20", "Решите уравнение: 3x + 5 = 20", "Solve: 3x + 5 = 20"), ["3", "5", "7", "25/3"], "b"),
        (("150 ning 20% i nechaga teng?", "Чему равны 20% от 150?", "What is 20% of 150?"), ["20", "30", "15", "35"], "b"),
        (("Tomonlari 6 va 4 bo'lgan to'g'ri to'rtburchak yuzi:", "Площадь прямоугольника со сторонами 6 и 4:", "Area of a rectangle with sides 6 and 4:"), ["20", "24", "10", "48"], "b"),
        (("(−3)² = ?", "(−3)² = ?", "(−3)² = ?"), ["−9", "9", "6", "−6"], "b"),
        (("4, 8 va 12 sonlarining o'rta arifmetigi:", "Среднее арифметическое чисел 4, 8 и 12:", "The mean of 4, 8 and 12:"), ["6", "8", "24", "12"], "b")],
    3: [(("x² − 5x + 6 = 0 tenglamaning ildizlari:", "Корни уравнения x² − 5x + 6 = 0:", "Roots of x² − 5x + 6 = 0:"),
         [tuple(f"1 {a} 6" for a in AND), tuple(f"2 {a} 3" for a in AND), tuple(f"−2 {a} −3" for a in AND), tuple(f"−1 {a} 6" for a in AND)], "b"),
        (("log₂ 32 = ?", "log₂ 32 = ?", "log₂ 32 = ?"), ["4", "5", "6", "16"], "b"),
        (("Radiusi 3 bo'lgan doira yuzi:", "Площадь круга радиусом 3:", "Area of a circle with radius 3:"), ["6π", "9π", "3π", "18π"], "b"),
        (("sin 30° = ?", "sin 30° = ?", "sin 30° = ?"), ["1/2", "√3/2", "√2/2", "1"], "a"),
        (("3, 7, 11, … arifmetik progressiyaning 10-hadi:", "10-й член арифметической прогрессии 3, 7, 11, …:", "The 10th term of the arithmetic sequence 3, 7, 11, …:"), ["39", "43", "40", "35"], "a")],
    4: [(("1 + 2 + 3 + … + 100 = ?", "1 + 2 + 3 + … + 100 = ?", "1 + 2 + 3 + … + 100 = ?"), ["5000", "5050", "5100", "10100"], "b"),
        (("Oltiburchakning nechta diagonali bor?", "Сколько диагоналей у шестиугольника?", "How many diagonals does a hexagon have?"), ["6", "9", "12", "15"], "b"),
        (("2²⁰²⁶ sonining oxirgi raqami:", "Последняя цифра числа 2²⁰²⁶:", "The last digit of 2²⁰²⁶:"), ["2", "4", "6", "8"], "b"),
        (("7 ga bo'linadigan ikki xonali sonlar nechta?", "Сколько двузначных чисел делятся на 7?", "How many two-digit numbers are divisible by 7?"), ["12", "13", "14", "15"], "b"),
        (("a + b = 7 va ab = 12 bo'lsa, a² + b² = ?", "Если a + b = 7 и ab = 12, то a² + b² = ?", "If a + b = 7 and ab = 12, then a² + b² = ?"), ["25", "37", "49", "24"], "a")],
}

qrows = []
def add_q(direction, level, question, options, correct, sort):
    qrows.append(f"  ((select id from public.directions where slug = {q(direction)}), {level}, {js(question)}, {js(options)}, {q(correct)}, {sort})")

for lvl, items in english.items():
    for i, (text, opts, c) in enumerate(items):
        add_q("english", lvl, same(text), opts_same(list(zip(K, opts))), c, lvl * 10 + i)
for lvl, items in russian.items():
    for i, (text, opts, c) in enumerate(items):
        add_q("russian", lvl, same(text), opts_same(list(zip(K, opts))), c, lvl * 10 + i)
for lvl, items in math.items():
    for i, (text, opts, c) in enumerate(items):
        add_q("math", lvl, tri(*text), opts_tri(list(zip(K, opts))), c, lvl * 10 + i)

w("insert into public.test_questions (direction_id, level, question, options, correct_key, sort) values")
w(",\n".join(qrows) + ";\n")

# IT interest test: no correct answer; each option gives points to tracks.
it = [
    (("Bo'sh vaqtingizda nima qilishni yoqtirasiz?", "Чем вы любите заниматься в свободное время?", "What do you enjoy doing in your free time?"),
     [(("Rasm chizish va chiroyli narsalar yaratish", "Рисовать и создавать красивые вещи", "Drawing and creating beautiful things"), {"design": 2}),
      (("Mantiqiy jumboqlar yechish", "Решать логические головоломки", "Solving logic puzzles"), {"backend": 2}),
      (("Sayt va ilovalar qanday ko'rinishini o'zgartirish", "Менять, как выглядят сайты и приложения", "Changing how websites and apps look"), {"frontend": 2}),
      (("O'yin o'ynash va ular qanday ishlashini bilish", "Играть в игры и разбираться, как они устроены", "Playing games and figuring out how they work"), {"python_kids": 2})]),
    (("Qaysi natija sizni ko'proq quvontiradi?", "Какой результат порадует вас больше?", "Which result would make you happiest?"),
     [(("Hamma ko'radigan chiroyli sahifa", "Красивая страница, которую видят все", "A beautiful page everyone can see"), {"frontend": 2, "design": 1}),
      (("Tez va xatosiz ishlaydigan tizim", "Система, которая работает быстро и без ошибок", "A system that runs fast with no errors"), {"backend": 2}),
      (("Odamlarga yoqadigan logo yoki banner", "Логотип или баннер, который нравится людям", "A logo or banner people love"), {"design": 2}),
      (("O'zim yasagan kichik o'yin", "Маленькая игра, которую я сделал сам", "A small game I built myself"), {"python_kids": 2})]),
    (("Yoshingiz nechada?", "Сколько вам лет?", "How old are you?"),
     [(("9–13", "9–13", "9–13"), {"python_kids": 3}),
      (("14–17", "14–17", "14–17"), {"frontend": 1, "design": 1}),
      (("18 va undan katta", "18 и старше", "18 or older"), {"frontend": 1, "backend": 1, "design": 1})]),
    (("Qaysi fan sizga osonroq?", "Какой предмет даётся вам легче?", "Which subject comes easiest to you?"),
     [(("Matematika", "Математика", "Math"), {"backend": 2}),
      (("Tasviriy san'at", "Изобразительное искусство", "Art"), {"design": 2}),
      (("Informatika", "Информатика", "Computer science"), {"frontend": 1, "backend": 1}),
      (("Hammasi qiziq, lekin o'ynab o'rganishni yoqtiraman", "Всё интересно, но люблю учиться играя", "Everything — but I like learning through play"), {"python_kids": 2})]),
    (("Qanday ishlashni afzal ko'rasiz?", "Как вам больше нравится работать?", "How do you prefer to work?"),
     [(("Natijani darhol ekranda ko'rish", "Сразу видеть результат на экране", "Seeing the result on screen right away"), {"frontend": 2}),
      (("Ko'rinmasa ham, ichki mantiqni qurish", "Строить внутреннюю логику, даже если её не видно", "Building the logic underneath, even if it is invisible"), {"backend": 2}),
      (("Rang, shrift va kompozitsiya bilan ishlash", "Работать с цветом, шрифтом и композицией", "Working with colour, type and layout"), {"design": 2}),
      (("Qadam-baqadam, o'yin orqali", "Шаг за шагом, через игру", "Step by step, through play"), {"python_kids": 2})]),
    (("Kelajakda kim bo'lishni xohlaysiz?", "Кем вы хотите стать в будущем?", "What would you like to become?"),
     [(("Frontend dasturchi", "Frontend-разработчиком", "A frontend developer"), {"frontend": 3}),
      (("Backend dasturchi", "Backend-разработчиком", "A backend developer"), {"backend": 3}),
      (("UI/UX dizayner", "UI/UX-дизайнером", "A UI/UX designer"), {"design": 3}),
      (("Hali bilmayman, sinab ko'rmoqchiman", "Пока не знаю, хочу попробовать", "Not sure yet — I want to try"), {"python_kids": 2})]),
]
itrows = []
for i, (text, options) in enumerate(it):
    opts = [{"key": K[j], "text": tri(*t), "scores": s} for j, (t, s) in enumerate(options)]
    itrows.append(f"  ((select id from public.directions where slug = 'it'), 1, {js(tri(*text))}, {js(opts)}, null, {i + 1})")
w("insert into public.test_questions (direction_id, level, question, options, correct_key, sort) values")
w(",\n".join(itrows) + ";\n")

# ── Settings
settings = {
    "sla_minutes": 15,
    "sla_escalation_minutes": 30,
    "demo_mode": True,
    "demo_reminder_24h_seconds": 30,
    "demo_reminder_2h_seconds": 60,
    "avg_study_months": 6,
    "tg_group_chat_id": None,
}
w("insert into public.settings (key, value) values")
w(",\n".join(f"  ({q(k)}, {q(json.dumps(v))}::jsonb)" for k, v in settings.items()))
w("on conflict (key) do nothing;\n")

w("-- Guruhlar, slotlar, demo lidlar, bronlar va reklama xarajatlari — bugungi sanaga nisbatan.")
w("select public.reset_demo_data();\n")
w("commit;")

sys.stdout.write("\n".join(out) + "\n")
