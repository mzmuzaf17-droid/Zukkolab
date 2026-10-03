import { describe, expect, it } from "vitest";
import { detectLanguage, faqAnswer, similarity } from "@/lib/ai/faq";
import { knowledgeText, systemPrompt } from "@/lib/ai/gemini";
import type { AiKnowledge } from "@/lib/ai/types";
import fixture from "@/lib/data/fixtures/content.json";

const k = fixture as unknown as AiKnowledge;

describe("detectLanguage", () => {
  it("kirill → ru, inglizcha → en, aks holda uz", () => {
    expect(detectLanguage("Сколько стоит?", "uz")).toBe("ru");
    expect(detectLanguage("How much is the course?", "uz")).toBe("en");
    expect(detectLanguage("Narxlar qancha?", "ru")).toBe("uz");
    expect(detectLanguage("Narxlar qancha?", "uz")).toBe("uz");
  });
});

describe("faqAnswer — 3 ta tayyor savol (9-bo'lim)", () => {
  it("Narxlar qancha? → FAQ javobi + sinov darsi", () => {
    const r = faqAnswer("Narxlar qancha?", k, "uz");
    expect(r.text).toContain("550 000");
    expect(r.cta).toBe("trial");
  });

  it("Qaysi filial menga yaqin? → filiallar manzili bazadan", () => {
    const r = faqAnswer("Qaysi filial menga yaqin?", k, "uz");
    for (const b of k.branches) expect(r.text).toContain(b.name_uz);
  });

  it("10 yoshli bolaga qaysi kurs? → faqat bolalar kurslari", () => {
    const r = faqAnswer("10 yoshli bolaga qaysi kurs?", k, "uz");
    expect(r.text).toContain("Bolalar uchun ingliz tili");
    expect(r.text).not.toContain("IELTS");
    expect(r.cta).toBe("trial");
  });

  it("ruscha savol — ruscha javob", () => {
    const r = faqAnswer("Какой курс подойдёт ребёнку 10 лет?", k, "ru");
    expect(r.text).toMatch(/Курсы для возраста 10/);
  });
});

describe("faqAnswer — boshqa holatlar", () => {
  it("aniq kurs: IELTS narxi", () => {
    const r = faqAnswer("IELTS kursi qancha turadi?", k, "uz");
    expect(r.text).toMatch(/1\s100\s000/);
  });

  it("5 yosh — 7 yoshdan qabul", () => {
    expect(faqAnswer("5 yoshli bolaga kurs bormi?", k, "uz").text).toContain("7 yoshdan");
  });

  it("noma'lum savol — to'qimaydi, menejerga", () => {
    const r = faqAnswer("Ertaga ob-havo qanday bo'ladi?", k, "uz");
    expect(r.cta).toBe("operator");
  });

  it("yozuvdagi kichik xatolarga chidamli", () => {
    expect(similarity("bolib tolash mumkinmi", "Boʻlib toʻlash mumkinmi?")).toBeGreaterThan(0.6);
  });
});

describe("gemini kontekst", () => {
  it("narxlar va qoidalar promptda", () => {
    expect(knowledgeText(k)).toContain("1100000 UZS/month");
    const p = systemPrompt(k);
    expect(p).toMatch(/80 words/);
    expect(p).toMatch(/Never ask for a phone/);
  });
});
