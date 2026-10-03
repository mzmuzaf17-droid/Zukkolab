import { expect, test } from "@playwright/test";

test("sinov darsiga yozilish: yo'nalish → vaqt → forma → rahmat", async ({ page }) => {
  await page.goto("/uz/sinov-darsi");
  await page.locator("fieldset").first().locator("button[aria-pressed]").first().click();
  await page.locator("fieldset").nth(1).locator("button[aria-pressed]").first().click();
  await page.getByRole("button", { name: "Davom etish" }).click();

  await page.locator("fieldset").nth(1).locator("button[aria-pressed]").first().click({ timeout: 15_000 });
  await page.getByRole("button", { name: "Davom etish" }).click();

  await page.getByLabel("Ismingiz").fill("Test Ota-ona");
  await page.getByLabel("Telefon raqami").fill("901234567");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Yozilish" }).click();

  await expect(page).toHaveURL(/\/uz\/rahmat\?b=/, { timeout: 20_000 });
  const ics = page.locator('a[href*="/ics"]');
  await expect(ics).toBeVisible();
  expect((await page.request.get((await ics.getAttribute("href"))!)).headers()["content-type"]).toContain(
    "text/calendar",
  );
});

test("daraja testi → natija → story rasmi", async ({ page }) => {
  await page.goto("/uz/test/english");
  for (let i = 1; i <= 12; i++) {
    await page.locator("fieldset button[aria-pressed]").first().click();
    // Javobdan keyin keyingi savolga o'zi o'tadi — progressni kutamiz.
    if (i < 12) await expect(page.getByText(`${i + 1} / 12`)).toBeVisible();
  }
  await page.getByRole("button", { name: "Natijani koʻrish" }).click();
  await expect(page.getByText("Sizning darajangiz")).toBeVisible({ timeout: 15_000 });

  const story = await page.getByText("Story uchun rasm").getAttribute("href");
  const res = await page.request.get(story!);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toBe("image/png");
});

test("AI yordamchi: tayyor savolga javob va harakat tugmasi", async ({ page }) => {
  await page.goto("/ru");
  await page.getByRole("button", { name: "Вопрос", exact: true }).click(); // telefonda — pastki paneldagi tab
  await page.getByRole("button", { name: "Сколько стоит обучение?" }).click();
  await expect(page.getByRole("dialog").getByText(/550\s000/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Записаться на пробный урок" }).last()).toBeVisible();
});

test("xavfsizlik sarlavhalari va SEO fayllari", async ({ request }) => {
  const home = await request.get("/uz");
  expect(home.headers()["content-security-policy"]).toContain(
    "frame-ancestors 'self' https://web.telegram.org",
  );
  const admin = await request.get("/admin/login");
  expect(admin.headers()["x-frame-options"]).toBe("DENY");
  expect((await request.get("/sitemap.xml")).status()).toBe(200);
  expect(await (await request.get("/robots.txt")).text()).toContain("User-Agent");
});
