"""Builds lib/data/fixtures/content.json from gen_seed.py data (dev only: container can't reach Supabase)."""
# Usage: python3 scripts/gen_fixture.py > lib/data/fixtures/content.json
import io, json, contextlib, uuid
ns = {}
with contextlib.redirect_stdout(io.StringIO()):
    exec(open(__import__("os").path.join(__import__("os").path.dirname(__file__), "gen_seed.py")).read(), ns)
uz = ns["uz"]
U = lambda *k: str(uuid.uuid5(uuid.NAMESPACE_URL, "zukkolab:" + ":".join(map(str, k))))
dirs = [{"id": U("dir", s), "slug": s, "name_uz": uz(a), "name_ru": b, "name_en": c, "icon": i, "color": col, "has_test": t, "is_active": True, "sort": o}
        for s, a, b, c, i, col, t, o in ns["directions"]]
dir_id = {d["slug"]: d["id"] for d in dirs}
h = ns["hours"]
branches = [{"id": U("br", s), "slug": s, "name_uz": uz(n[0]), "name_ru": n[1], "name_en": n[2], "address_uz": uz(a[0]), "address_ru": a[1], "address_en": a[2],
             "landmark_uz": uz(l[0]), "landmark_ru": l[1], "landmark_en": l[2], "lat": lat, "lng": lng, "phone": ph,
             "working_hours_uz": uz(h[0]), "working_hours_ru": h[1], "working_hours_en": h[2], "photo_url": None, "is_active": True, "sort": o}
            for s, n, a, l, lat, lng, ph, o in ns["branches"]]
courses = []
for slug, d, t, desc, prog, lf, lt, age, mo, pw, mi, price, feat, srt in ns["courses"]:
    courses.append({"id": U("c", slug), "direction_id": dir_id[d], "slug": slug, "title_uz": uz(t[0]), "title_ru": t[1], "title_en": t[2],
                    "description_uz": uz(desc[0]), "description_ru": desc[1], "description_en": desc[2],
                    "program_uz": [uz(x) for x in prog[0]], "program_ru": prog[1], "program_en": prog[2],
                    "level_from": lf, "level_to": lt, "age_group": age, "duration_months": mo, "lessons_per_week": pw,
                    "lesson_minutes": mi, "price_monthly": price, "is_featured": feat, "is_active": True, "sort": srt})
teachers = [{"id": U("t", n), "full_name": n, "photo_url": None, "direction_id": dir_id[d], "experience_years": y, "certificates": [uz(c) for c in certs],
             "bio_uz": uz(b[0]), "bio_ru": b[1], "bio_en": b[2], "video_url": None, "is_active": True, "sort": i + 1}
            for i, (n, d, y, certs, b) in enumerate(ns["teachers"])]
faq = [{"id": U("faq", i), "question_uz": uz(a), "question_ru": b, "question_en": c, "answer_uz": uz(d), "answer_ru": e, "answer_en": f, "is_active": True, "sort": i + 1}
       for i, (a, b, c, d, e, f) in enumerate(ns["faq"])]
testimonials = [{"id": U("tm", i), "name": uz(n), "direction_id": dir_id[d], "achievement_uz": uz(a[0]), "achievement_ru": a[1], "achievement_en": a[2],
                 "text_uz": uz(t[0]), "text_ru": t[1], "text_en": t[2], "photo_url": None, "video_url": None, "is_demo": True, "is_active": True, "sort": i + 1}
                for i, (n, d, a, t) in enumerate(ns["testimonials"])]
# Groups mirror reset_demo_data(): start_date is stored as an offset from today.
su = ['Du, Chor, Ju · 15:00–16:30', 'Se, Pa, Sha · 18:00–19:30', 'Du, Chor, Ju · 10:00–11:30', 'Se, Pa, Sha · 15:00–16:30']
sr = ['Пн, Ср, Пт · 15:00–16:30', 'Вт, Чт, Сб · 18:00–19:30', 'Пн, Ср, Пт · 10:00–11:30', 'Вт, Чт, Сб · 15:00–16:30']
se = ['Mon, Wed, Fri · 15:00–16:30', 'Tue, Thu, Sat · 18:00–19:30', 'Mon, Wed, Fri · 10:00–11:30', 'Tue, Thu, Sat · 15:00–16:30']
groups = []
for c in courses:
    s = c["sort"]
    same_dir = [t for t in teachers if t["direction_id"] == c["direction_id"]]
    teacher = same_dir[s % len(same_dir)]["id"] if same_dir else None
    for k, (off, br, sch, enrolled) in enumerate([(3 + (s * 5) % 12, s % 3, s % 4, 9 + s % 3), (17 + (s * 3) % 10, (s + 1) % 3, (s + 1) % 4, 3 + s % 5)]):
        groups.append({"id": U("g", c["slug"], k), "course_id": c["id"], "branch_id": branches[br]["id"], "teacher_id": teacher,
                       "start_in_days": off, "schedule_text_uz": su[sch], "schedule_text_ru": sr[sch], "schedule_text_en": se[sch],
                       "capacity": 12, "enrolled_count": enrolled, "is_open": True})
# Test savollari: gen_seed.py dagi bank bilan bir xil (correct_key faqat serverda ishlatiladi).
same, tri = ns["same"], ns["tri"]
K = ns["K"]
questions = []
for slug, bank, conv in [("english", ns["english"], same), ("russian", ns["russian"], same)]:
    for lvl, items in bank.items():
        for i, (text, opts, c) in enumerate(items):
            questions.append({"id": U("q", slug, lvl, i), "direction_id": dir_id[slug], "level": lvl, "question": conv(text),
                              "options": [{"key": k, "text": same(o)} for k, o in zip(K, opts)], "correct_key": c, "sort": lvl * 10 + i})
for lvl, items in ns["math"].items():
    for i, (text, opts, c) in enumerate(items):
        questions.append({"id": U("q", "math", lvl, i), "direction_id": dir_id["math"], "level": lvl, "question": tri(*text),
                          "options": [{"key": k, "text": tri(*o) if isinstance(o, tuple) else same(o)} for k, o in zip(K, opts)], "correct_key": c, "sort": lvl * 10 + i})
for i, (text, options) in enumerate(ns["it"]):
    questions.append({"id": U("q", "it", i), "direction_id": dir_id["it"], "level": 1, "question": tri(*text),
                      "options": [{"key": K[j], "text": tri(*t), "scores": sc} for j, (t, sc) in enumerate(options)], "correct_key": None, "sort": i + 1})
print(json.dumps({"test_questions": questions, "directions": dirs, "branches": branches, "courses": courses, "teachers": teachers, "faq": faq,
                  "testimonials": testimonials, "groups": groups}, ensure_ascii=False, indent=1))
